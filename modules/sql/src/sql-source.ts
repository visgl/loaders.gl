// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, Schema} from '@loaders.gl/schema';
import {DataSource} from '@loaders.gl/loader-utils';
import type {CoreAPI, RequiredOptions} from '@loaders.gl/loader-utils';

import type {
  SQLAdapter,
  SQLAdapterFactory,
  SQLCatalogInfo,
  SQLMetadata,
  SQLQueryOptions,
  SQLSchemaInfo,
  SQLSourceOptions,
  SQLTableInfo
} from './sql-types';
import {convertRowsToArrowTable, isNodeRuntime} from './sql-utils';

const SQL_ADAPTER_FACTORIES = new Map<string, SQLAdapterFactory>();

/** Registers a runtime adapter for a SQL source type. */
export function registerSQLAdapter(type: string, factory: SQLAdapterFactory): void {
  SQL_ADAPTER_FACTORIES.set(type, factory);
}

/** Returns the registered adapter factory for a SQL source type. */
export function getSQLAdapterFactory(type: string): SQLAdapterFactory | undefined {
  return SQL_ADAPTER_FACTORIES.get(type);
}

/** Base options shared by all SQL sources. */
export const SQL_SOURCE_DEFAULT_OPTIONS: Omit<RequiredOptions<SQLSourceOptions>, 'core'> = {
  sql: {
    resultFormat: 'auto',
    adapterOptions: {},
    browserAdapterFactory: undefined!,
    nodeAdapterFactory: undefined!
  },
  duckdb: {
    accessMode: 'auto',
    bundles: undefined!,
    databasePath: undefined!,
    remoteUrl: undefined!,
    workerUrl: undefined!
  },
  snowflake: {
    account: undefined!,
    database: undefined!,
    schema: undefined!,
    token: undefined!,
    warehouse: undefined!,
    role: undefined!,
    authenticator: undefined!
  }
};

/** Shared SQL-backed data source implementation. */
export class SQLDataSource extends DataSource<string, SQLSourceOptions> {
  private readonly sourceType: string;
  private readonly adapterFactory?: SQLAdapterFactory;
  private adapterPromise: Promise<SQLAdapter> | null = null;
  private metadataPromise: Promise<SQLMetadata> | null = null;

  constructor(
    data: string,
    options: SQLSourceOptions,
    sourceType: string,
    defaultOptions: Omit<RequiredOptions<SQLSourceOptions>, 'core'> = SQL_SOURCE_DEFAULT_OPTIONS,
    adapterFactory?: SQLAdapterFactory,
    coreApi?: CoreAPI
  ) {
    super(data, options, defaultOptions, coreApi);
    this.sourceType = sourceType;
    this.adapterFactory = adapterFactory || getSQLAdapterFactory(sourceType);
  }

  /** Returns cached high-level metadata for the SQL source. */
  async getMetadata(): Promise<SQLMetadata> {
    if (!this.metadataPromise) {
      this.metadataPromise = this.loadMetadata();
    }
    return this.metadataPromise;
  }

  /** Lists available catalogs from the connected database. */
  async listCatalogs(): Promise<SQLCatalogInfo[]> {
    const adapter = await this.getAdapter();
    return await adapter.listCatalogs();
  }

  /** Lists available schemas from the connected database. */
  async listSchemas(catalogName?: string): Promise<SQLSchemaInfo[]> {
    const adapter = await this.getAdapter();
    return await adapter.listSchemas(catalogName);
  }

  /** Lists available tables from the connected database. */
  async listTables(options?: {catalogName?: string; schemaName?: string}): Promise<SQLTableInfo[]> {
    const adapter = await this.getAdapter();
    return await adapter.listTables(options);
  }

  /** Returns the schema for a specific SQL table. */
  async getTableSchema(options: {
    catalogName?: string;
    schemaName?: string;
    tableName: string;
  }): Promise<Schema> {
    const adapter = await this.getAdapter();
    return await adapter.getTableSchema(options);
  }

  /** Executes a SQL query and returns object rows. */
  async queryRows(
    sqlText: string,
    options: SQLQueryOptions = {}
  ): Promise<Record<string, unknown>[]> {
    const adapter = await this.getAdapter();
    return await adapter.executeRows(sqlText, options);
  }

  /** Executes a SQL query and returns a loaders.gl Arrow table. */
  async queryArrow(sqlText: string, options: SQLQueryOptions = {}): Promise<ArrowTable> {
    const adapter = await this.getAdapter();
    if (adapter.executeArrow) {
      return await adapter.executeArrow(sqlText, options);
    }
    const rows = await adapter.executeRows(sqlText, options);
    return convertRowsToArrowTable(rows);
  }

  /** Closes any underlying adapter connection. */
  async close(): Promise<void> {
    if (!this.adapterPromise) {
      return;
    }
    const adapter = await this.adapterPromise;
    await adapter.close();
    this.adapterPromise = null;
    this.metadataPromise = null;
  }

  protected async getAdapter(): Promise<SQLAdapter> {
    if (!this.adapterPromise) {
      this.adapterPromise = this.loadAdapter();
    }
    return await this.adapterPromise;
  }

  private async loadAdapter(): Promise<SQLAdapter> {
    try {
      const runtimeFactory = isNodeRuntime()
        ? this.options.sql?.nodeAdapterFactory
        : this.options.sql?.browserAdapterFactory;
      const factory = runtimeFactory || this.adapterFactory;
      if (!factory) {
        throw new Error(`No SQL adapter is registered for source type "${this.sourceType}".`);
      }

      const adapter = await factory({
        coreApi: this.coreApi,
        options: this.options,
        sourceType: this.sourceType,
        url: this.url
      });
      await adapter.connect();
      return adapter;
    } catch (error) {
      throw this.reportError(
        error,
        `Failed to create SQL adapter for ${this.sourceType} from ${this.url}`
      );
    }
  }

  private async loadMetadata(): Promise<SQLMetadata> {
    const adapter = await this.getAdapter();
    const [catalogs, schemas, tables] = await Promise.all([
      adapter.listCatalogs(),
      adapter.listSchemas(),
      adapter.listTables()
    ]);
    return {
      type: this.sourceType,
      capabilities: adapter.capabilities,
      catalogs,
      schemas,
      tables
    };
  }
}
