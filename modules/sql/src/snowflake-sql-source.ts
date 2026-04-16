// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema} from '@loaders.gl/schema';
import type {Source, CoreAPI} from '@loaders.gl/loader-utils';

import {SQLDataSource, SQL_SOURCE_DEFAULT_OPTIONS} from './sql-source';
import type {
  SQLAdapter,
  SQLAdapterFactoryContext,
  SQLQueryOptions,
  SQLSourceOptions,
  SQLTableInfo
} from './sql-types';
import {
  convertRowsToArrowTable,
  convertSQLColumnsToSchema,
  getQualifiedTableName
} from './sql-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Snowflake-backed SQL source. */
export const SnowflakeSQLSource = {
  name: 'SnowflakeSQLSource',
  id: 'snowflake-sql',
  module: 'sql',
  version: VERSION,
  extensions: [],
  mimeTypes: [],
  type: 'snowflake-sql',
  fromUrl: true,
  fromBlob: false,
  defaultOptions: SQL_SOURCE_DEFAULT_OPTIONS,
  testURL: (url: string): boolean => /^(sql\+snowflake|snowflake):\/\//i.test(url),
  createDataSource: (
    data: string,
    options: SQLSourceOptions,
    coreApi?: CoreAPI
  ): SnowflakeSQLDataSource => new SnowflakeSQLDataSource(data, options, coreApi)
} as const satisfies Source<SnowflakeSQLDataSource>;

/** SQLDataSource specialization for Snowflake. */
export class SnowflakeSQLDataSource extends SQLDataSource {
  constructor(data: string, options: SQLSourceOptions, coreApi?: CoreAPI) {
    super(
      data,
      options,
      SnowflakeSQLSource.type,
      SQL_SOURCE_DEFAULT_OPTIONS,
      createSnowflakeAdapter,
      coreApi
    );
  }
}

async function createSnowflakeAdapter(context: SQLAdapterFactoryContext): Promise<SQLAdapter> {
  const baseStatementUrl = getSnowflakeStatementsUrl(context.url, context.options);
  const authorization = context.options.snowflake?.token;
  if (!authorization) {
    throw new Error('SnowflakeSQLSource requires snowflake.token.');
  }

  const executeRows = async (
    sqlText: string,
    options: SQLQueryOptions = {}
  ): Promise<Record<string, unknown>[]> => {
    const initialResponse = await executeSnowflakeStatement(
      context,
      baseStatementUrl,
      authorization,
      sqlText,
      options
    );
    const responses = [initialResponse];

    const partitionInfo = initialResponse.resultSetMetaData?.partitionInfo || [];
    for (let partitionIndex = 1; partitionIndex < partitionInfo.length; partitionIndex++) {
      responses.push(
        await fetchSnowflakeJson(
          context,
          `${baseStatementUrl}/${initialResponse.statementHandle}?partition=${partitionIndex}`,
          authorization,
          {method: 'GET', signal: options.signal}
        )
      );
    }

    const rowType = initialResponse.resultSetMetaData?.rowType || [];
    const rowNames = rowType.map((row: {name: string}) => row.name);
    return responses.flatMap((response: {data?: unknown[][]}) =>
      (response.data || []).map((values: unknown[]) => {
        const row: Record<string, unknown> = {};
        rowNames.forEach((name, index) => {
          row[name] = values[index];
        });
        return row;
      })
    );
  };

  return {
    capabilities: {
      supportsArrow: false,
      supportsMetadata: true,
      runtime: 'both',
      isDynamic: false
    },
    async connect(): Promise<void> {
      if (!authorization) {
        throw new Error('SnowflakeSQLSource requires snowflake.token.');
      }
    },
    async close(): Promise<void> {},
    async listCatalogs() {
      const rows = await executeRows('SHOW DATABASES');
      return rows.map(row => ({
        catalogName: String(row.name || row.NAME)
      }));
    },
    async listSchemas() {
      const rows = await executeRows('SHOW SCHEMAS');
      return rows.map(row => ({
        catalogName: row.database_name ? String(row.database_name) : undefined,
        schemaName: String(row.name || row.NAME)
      }));
    },
    async listTables(): Promise<SQLTableInfo[]> {
      const rows = await executeRows('SHOW TABLES');
      return rows.map(row => ({
        catalogName: row.database_name ? String(row.database_name) : undefined,
        schemaName: row.schema_name ? String(row.schema_name) : undefined,
        tableName: String(row.name || row.NAME),
        tableType: row.kind ? String(row.kind) : undefined
      }));
    },
    async getTableSchema(options: {
      catalogName?: string;
      schemaName?: string;
      tableName: string;
    }): Promise<Schema> {
      const qualifiedTableName = getQualifiedTableName(options);
      const rows = await executeRows(`DESCRIBE TABLE ${qualifiedTableName}`);
      return convertSQLColumnsToSchema(
        rows.map((row, index) => ({
          columnName: String(row.name || row.NAME || `column_${index + 1}`),
          sqlType: String(row.type || row.TYPE || 'VARCHAR'),
          nullable: String(row.null || row.NULL || '').toUpperCase() === 'Y',
          ordinalPosition: index + 1
        }))
      );
    },
    async executeRows(
      sqlText: string,
      options: SQLQueryOptions = {}
    ): Promise<Record<string, unknown>[]> {
      return await executeRows(sqlText, options);
    },
    async executeArrow(sqlText: string, options: SQLQueryOptions = {}) {
      const rows = await executeRows(sqlText, options);
      return convertRowsToArrowTable(rows);
    }
  };
}

async function executeSnowflakeStatement(
  context: SQLAdapterFactoryContext,
  baseStatementUrl: string,
  authorization: string,
  sqlText: string,
  options: SQLQueryOptions
): Promise<any> {
  let response = await fetchSnowflakeJson(context, baseStatementUrl, authorization, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      statement: sqlText,
      timeout: 60,
      bindings: normalizeSnowflakeBindings(options.parameters),
      warehouse: context.options.snowflake?.warehouse,
      database: context.options.snowflake?.database,
      schema: context.options.snowflake?.schema,
      role: context.options.snowflake?.role
    }),
    signal: options.signal
  });

  while (response?.statementStatusUrl && !response?.data) {
    const pollUrl = `${getSnowflakeBaseUrl(context.url, context.options)}${response.statementStatusUrl}`;
    response = await fetchSnowflakeJson(context, pollUrl, authorization, {
      method: 'GET',
      signal: options.signal
    });
  }

  if (response?.code || response?.message) {
    throw new Error(response.message || `Snowflake SQL API error ${response.code}`);
  }

  return response;
}

async function fetchSnowflakeJson(
  context: SQLAdapterFactoryContext,
  url: string,
  authorization: string,
  requestInit: RequestInit
): Promise<any> {
  const customFetch = context.options.core?.loadOptions?.core?.fetch;
  const headers = new Headers(requestInit.headers);
  headers.set(
    'Authorization',
    authorization.startsWith('Bearer ') ? authorization : `Bearer ${authorization}`
  );
  headers.set('Accept', 'application/json');

  const response =
    typeof customFetch === 'function'
      ? await customFetch(url, {
          ...requestInit,
          headers
        })
      : await context.coreApi.fetchFile(url, {
          ...requestInit,
          headers
        });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.message || `${response.status} ${response.statusText}`);
  }
  return json;
}

function normalizeSnowflakeBindings(
  parameters: SQLQueryOptions['parameters']
): Record<string, {type: string; value: unknown}> | undefined {
  if (!parameters || Array.isArray(parameters)) {
    return undefined;
  }
  const bindings: Record<string, {type: string; value: unknown}> = {};
  for (const [key, value] of Object.entries(parameters)) {
    bindings[key] = {
      type: typeof value === 'number' ? 'FIXED' : 'TEXT',
      value
    };
  }
  return bindings;
}

function getSnowflakeStatementsUrl(url: string, options: SQLSourceOptions): string {
  return `${getSnowflakeBaseUrl(url, options)}/api/v2/statements`;
}

function getSnowflakeBaseUrl(url: string, options: SQLSourceOptions): string {
  if (/^https?:\/\//i.test(url)) {
    return url.replace(/\/api\/v2\/statements.*$/, '');
  }

  const parsedUrl = new URL(url);
  const account = options.snowflake?.account || parsedUrl.hostname;
  if (!account) {
    throw new Error('SnowflakeSQLSource requires a Snowflake account URL or snowflake.account.');
  }
  return `https://${account}.snowflakecomputing.com`;
}
