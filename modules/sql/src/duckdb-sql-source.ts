// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema} from '@loaders.gl/schema';
import type {SourceLoader, CoreAPI} from '@loaders.gl/loader-utils';
import {convertArrowToTable} from '@loaders.gl/schema-utils';

import {SQLDataSource, SQL_SOURCE_DEFAULT_OPTIONS} from './sql-source';
import type {
  SQLAdapter,
  SQLAdapterFactoryContext,
  SQLCatalogInfo,
  SQLColumnInfo,
  SQLQueryOptions,
  SQLSourceOptions,
  SQLTableInfo
} from './sql-types';
import {
  convertRowsToArrowTable,
  convertSQLColumnsToSchema,
  escapeSqlString,
  isNodeRuntime
} from './sql-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** DuckDB-backed SQL source. */
export const DuckDBSQLSource = {
  dataType: null as unknown as DuckDBSQLDataSource,
  batchType: null as never,
  name: 'DuckDBSQLSource',
  id: 'duckdb-sql',
  module: 'sql',
  version: VERSION,
  extensions: ['duckdb', 'db'],
  mimeTypes: [],
  type: 'duckdb-sql',
  fromUrl: true,
  fromBlob: false,
  options: {
    sql: {
      resultFormat: 'auto',
      adapterOptions: {},
      browserAdapterFactory: undefined,
      nodeAdapterFactory: undefined
    },
    duckdb: {
      accessMode: 'auto',
      bundles: undefined,
      databasePath: undefined,
      remoteUrl: undefined,
      workerUrl: undefined
    },
    snowflake: {
      account: undefined,
      database: undefined,
      schema: undefined,
      token: undefined,
      warehouse: undefined,
      role: undefined,
      authenticator: undefined
    }
  },
  defaultOptions: SQL_SOURCE_DEFAULT_OPTIONS,
  testURL: (url: string): boolean => /^duckdb:\/\//i.test(url),
  createDataSource: (
    data: string,
    options: SQLSourceOptions,
    coreApi?: CoreAPI
  ): DuckDBSQLDataSource => new DuckDBSQLDataSource(data, options, coreApi)
} as const satisfies SourceLoader<DuckDBSQLDataSource>;

/** SQLDataSource specialization for DuckDB. */
export class DuckDBSQLDataSource extends SQLDataSource {
  constructor(data: string, options: SQLSourceOptions, coreApi?: CoreAPI) {
    super(
      data,
      options,
      DuckDBSQLSource.type,
      SQL_SOURCE_DEFAULT_OPTIONS,
      createDuckDBAdapter,
      coreApi
    );
  }
}

async function createDuckDBAdapter(context: SQLAdapterFactoryContext): Promise<SQLAdapter> {
  if (context.options.duckdb?.remoteUrl) {
    throw new Error('Remote DuckDB adapters are not implemented yet.');
  }
  if (isNodeRuntime()) {
    return await createDuckDBNodeAdapter(context);
  }
  return await createDuckDBBrowserAdapter(context);
}

async function createDuckDBNodeAdapter(context: SQLAdapterFactoryContext): Promise<SQLAdapter> {
  const duckdb = await import('@duckdb/node-api');

  const databasePath = getDuckDBDatabasePath(context.url, context.options);
  const configuration =
    context.options.duckdb?.accessMode && context.options.duckdb.accessMode !== 'auto'
      ? {access_mode: context.options.duckdb.accessMode}
      : undefined;

  let connection: any;

  const executeRows = async (
    sqlText: string,
    options: SQLQueryOptions = {}
  ): Promise<Record<string, unknown>[]> => {
    if (!connection) {
      const instance = await duckdb.DuckDBInstance.create(databasePath, configuration);
      connection = await instance.connect();
    }
    const reader = await connection.runAndReadAll(sqlText, options.parameters);
    return reader.getRowObjectsJson();
  };

  return {
    capabilities: {
      supportsArrow: true,
      supportsMetadata: true,
      runtime: 'node',
      isDynamic: true
    },
    async connect(): Promise<void> {
      if (!connection) {
        const instance = await duckdb.DuckDBInstance.create(databasePath, configuration);
        connection = await instance.connect();
      }
    },
    async close(): Promise<void> {
      if (connection?.closeSync) {
        connection.closeSync();
      }
      connection = null;
    },
    async listCatalogs(): Promise<SQLCatalogInfo[]> {
      const rows = await executeRows(`
        SELECT DISTINCT catalog_name
        FROM information_schema.schemata
        ORDER BY catalog_name
      `);
      return rows.map(row => ({catalogName: String(row.catalog_name)}));
    },
    async listSchemas(catalogName?: string) {
      const filter = catalogName ? `WHERE catalog_name = '${escapeSqlString(catalogName)}'` : '';
      const rows = await executeRows(`
        SELECT catalog_name, schema_name
        FROM information_schema.schemata
        ${filter}
        ORDER BY catalog_name, schema_name
      `);
      return rows.map(row => ({
        catalogName: row.catalog_name ? String(row.catalog_name) : undefined,
        schemaName: String(row.schema_name)
      }));
    },
    async listTables(options?: {
      catalogName?: string;
      schemaName?: string;
    }): Promise<SQLTableInfo[]> {
      const filters = [
        options?.catalogName
          ? `table_catalog = '${escapeSqlString(options.catalogName)}'`
          : undefined,
        options?.schemaName ? `table_schema = '${escapeSqlString(options.schemaName)}'` : undefined,
        `table_schema NOT IN ('information_schema', 'pg_catalog')`
      ].filter(Boolean);
      const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
      const rows = await executeRows(`
        SELECT table_catalog, table_schema, table_name, table_type
        FROM information_schema.tables
        ${whereClause}
        ORDER BY table_catalog, table_schema, table_name
      `);
      return rows.map(row => ({
        catalogName: row.table_catalog ? String(row.table_catalog) : undefined,
        schemaName: row.table_schema ? String(row.table_schema) : undefined,
        tableName: String(row.table_name),
        tableType: row.table_type ? String(row.table_type) : undefined
      }));
    },
    async getTableSchema(options: {
      catalogName?: string;
      schemaName?: string;
      tableName: string;
    }): Promise<Schema> {
      const filters = [
        options.catalogName
          ? `table_catalog = '${escapeSqlString(options.catalogName)}'`
          : undefined,
        options.schemaName ? `table_schema = '${escapeSqlString(options.schemaName)}'` : undefined,
        `table_name = '${escapeSqlString(options.tableName)}'`
      ].filter(Boolean);
      const rows = await executeRows(`
        SELECT table_catalog, table_schema, table_name, column_name, data_type, is_nullable, ordinal_position
        FROM information_schema.columns
        WHERE ${filters.join(' AND ')}
        ORDER BY ordinal_position
      `);
      const columns = rows.map(
        row =>
          ({
            catalogName: row.table_catalog ? String(row.table_catalog) : undefined,
            schemaName: row.table_schema ? String(row.table_schema) : undefined,
            tableName: row.table_name ? String(row.table_name) : undefined,
            columnName: String(row.column_name),
            sqlType: String(row.data_type),
            nullable: row.is_nullable === 'YES',
            ordinalPosition: Number(row.ordinal_position)
          }) satisfies SQLColumnInfo
      );
      return convertSQLColumnsToSchema(columns);
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

async function createDuckDBBrowserAdapter(context: SQLAdapterFactoryContext): Promise<SQLAdapter> {
  const duckdb = await import('@duckdb/duckdb-wasm');

  const logger = new duckdb.ConsoleLogger();
  const selectedBundles = await duckdb.selectBundle(duckdb.getJsDelivrBundles());
  const bundles = {
    ...selectedBundles,
    ...context.options.duckdb?.bundles
  };
  const workerUrl = context.options.duckdb?.workerUrl || selectedBundles.mainWorker;
  if (!workerUrl) {
    throw new Error('DuckDBSQLSource could not resolve a worker bundle URL.');
  }
  const worker = await duckdb.createWorker(workerUrl);
  const database = new duckdb.AsyncDuckDB(logger, worker);
  await database.instantiate(bundles.mainModule, bundles.pthreadWorker);
  const connection = await database.connect();

  const executeRows = async (sqlText: string): Promise<Record<string, unknown>[]> => {
    const result = await connection.query(sqlText);
    return convertArrowToTable(result, 'object-row-table').data;
  };

  return {
    capabilities: {
      supportsArrow: true,
      supportsMetadata: true,
      runtime: 'browser',
      isDynamic: true
    },
    async connect(): Promise<void> {},
    async close(): Promise<void> {
      await connection.close();
      await database.terminate();
      worker.terminate();
    },
    async listCatalogs(): Promise<SQLCatalogInfo[]> {
      const rows = await executeRows(`
        SELECT DISTINCT catalog_name
        FROM information_schema.schemata
        ORDER BY catalog_name
      `);
      return rows.map(row => ({catalogName: String(row.catalog_name)}));
    },
    async listSchemas(catalogName?: string) {
      const filter = catalogName ? `WHERE catalog_name = '${escapeSqlString(catalogName)}'` : '';
      const rows = await executeRows(`
        SELECT catalog_name, schema_name
        FROM information_schema.schemata
        ${filter}
        ORDER BY catalog_name, schema_name
      `);
      return rows.map(row => ({
        catalogName: row.catalog_name ? String(row.catalog_name) : undefined,
        schemaName: String(row.schema_name)
      }));
    },
    async listTables(options?: {
      catalogName?: string;
      schemaName?: string;
    }): Promise<SQLTableInfo[]> {
      const filters = [
        options?.catalogName
          ? `table_catalog = '${escapeSqlString(options.catalogName)}'`
          : undefined,
        options?.schemaName ? `table_schema = '${escapeSqlString(options.schemaName)}'` : undefined,
        `table_schema NOT IN ('information_schema', 'pg_catalog')`
      ].filter(Boolean);
      const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
      const rows = await executeRows(`
        SELECT table_catalog, table_schema, table_name, table_type
        FROM information_schema.tables
        ${whereClause}
        ORDER BY table_catalog, table_schema, table_name
      `);
      return rows.map(row => ({
        catalogName: row.table_catalog ? String(row.table_catalog) : undefined,
        schemaName: row.table_schema ? String(row.table_schema) : undefined,
        tableName: String(row.table_name),
        tableType: row.table_type ? String(row.table_type) : undefined
      }));
    },
    async getTableSchema(options: {
      catalogName?: string;
      schemaName?: string;
      tableName: string;
    }): Promise<Schema> {
      const filters = [
        options.catalogName
          ? `table_catalog = '${escapeSqlString(options.catalogName)}'`
          : undefined,
        options.schemaName ? `table_schema = '${escapeSqlString(options.schemaName)}'` : undefined,
        `table_name = '${escapeSqlString(options.tableName)}'`
      ].filter(Boolean);
      const rows = await executeRows(`
        SELECT table_catalog, table_schema, table_name, column_name, data_type, is_nullable, ordinal_position
        FROM information_schema.columns
        WHERE ${filters.join(' AND ')}
        ORDER BY ordinal_position
      `);
      const columns = rows.map(
        row =>
          ({
            catalogName: row.table_catalog ? String(row.table_catalog) : undefined,
            schemaName: row.table_schema ? String(row.table_schema) : undefined,
            tableName: row.table_name ? String(row.table_name) : undefined,
            columnName: String(row.column_name),
            sqlType: String(row.data_type),
            nullable: row.is_nullable === 'YES',
            ordinalPosition: Number(row.ordinal_position)
          }) satisfies SQLColumnInfo
      );
      return convertSQLColumnsToSchema(columns);
    },
    async executeRows(sqlText: string): Promise<Record<string, unknown>[]> {
      return await executeRows(sqlText);
    },
    async executeArrow(sqlText: string) {
      const result = await connection.query(sqlText);
      return convertArrowToTable(result, 'arrow-table');
    }
  };
}

function getDuckDBDatabasePath(url: string, options: SQLSourceOptions): string {
  if (options.duckdb?.databasePath) {
    return options.duckdb.databasePath;
  }

  const parsedUrl = new URL(url);
  const pathname = decodeURIComponent(parsedUrl.pathname || '');
  if (!pathname || pathname === '/') {
    return ':memory:';
  }
  return pathname.slice(1) || ':memory:';
}
