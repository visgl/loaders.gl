// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, Schema} from '@loaders.gl/schema';
import type {CoreAPI, DataSourceOptions} from '@loaders.gl/loader-utils';

export type SQLParameterValues = unknown[] | Record<string, unknown>;

/** Query-level options for SQL data sources. */
export type SQLQueryOptions = {
  parameters?: SQLParameterValues;
  signal?: AbortSignal;
};

/** Normalized database catalog metadata. */
export type SQLCatalogInfo = {
  catalogName: string;
};

/** Normalized database schema metadata. */
export type SQLSchemaInfo = {
  catalogName?: string;
  schemaName: string;
};

/** Normalized table metadata returned by SQL sources. */
export type SQLTableInfo = {
  catalogName?: string;
  schemaName?: string;
  tableName: string;
  tableType?: string;
};

/** Normalized column metadata returned by SQL sources. */
export type SQLColumnInfo = {
  catalogName?: string;
  schemaName?: string;
  tableName?: string;
  columnName: string;
  sqlType: string;
  nullable?: boolean;
  ordinalPosition?: number;
};

/** Top-level metadata returned by `SQLDataSource#getMetadata`. */
export type SQLMetadata = {
  type: string;
  capabilities: SQLAdapterCapabilities;
  catalogs: SQLCatalogInfo[];
  schemas: SQLSchemaInfo[];
  tables: SQLTableInfo[];
};

/** Adapter capability flags used for runtime selection and reporting. */
export type SQLAdapterCapabilities = {
  supportsArrow: boolean;
  supportsMetadata: boolean;
  runtime: 'node' | 'browser' | 'both';
  isDynamic?: boolean;
};

/** Runtime adapter interface used by SQL-backed data sources. */
export interface SQLAdapter {
  readonly capabilities: SQLAdapterCapabilities;
  connect(): Promise<void>;
  close(): Promise<void>;
  listCatalogs(): Promise<SQLCatalogInfo[]>;
  listSchemas(catalogName?: string): Promise<SQLSchemaInfo[]>;
  listTables(options?: {catalogName?: string; schemaName?: string}): Promise<SQLTableInfo[]>;
  getTableSchema(options: {
    catalogName?: string;
    schemaName?: string;
    tableName: string;
  }): Promise<Schema>;
  executeRows(sql: string, options?: SQLQueryOptions): Promise<Record<string, unknown>[]>;
  executeArrow?(sql: string, options?: SQLQueryOptions): Promise<ArrowTable>;
}

/** Context passed to SQL adapter factories during source initialization. */
export type SQLAdapterFactoryContext = {
  coreApi: CoreAPI;
  options: SQLSourceOptions;
  sourceType: string;
  url: string;
};

/** Factory signature for creating runtime-specific SQL adapters. */
export type SQLAdapterFactory = (context: SQLAdapterFactoryContext) => Promise<SQLAdapter>;

/** Shared options accepted by SQL-backed data sources. */
export type SQLSourceOptions = DataSourceOptions & {
  sql?: {
    resultFormat?: 'auto' | 'arrow' | 'rows';
    adapterOptions?: Record<string, unknown>;
    browserAdapterFactory?: SQLAdapterFactory;
    nodeAdapterFactory?: SQLAdapterFactory;
  };
  duckdb?: {
    accessMode?: 'auto' | 'read-write' | 'read-only';
    bundles?: {
      mainModule?: string;
      mainWorker?: string;
      pthreadWorker?: string;
    };
    databasePath?: string;
    remoteUrl?: string;
    workerUrl?: string;
  };
  snowflake?: {
    account?: string;
    database?: string;
    schema?: string;
    token?: string;
    warehouse?: string;
    role?: string;
    authenticator?: string;
  };
};
