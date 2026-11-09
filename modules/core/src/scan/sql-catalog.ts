// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema} from '@loaders.gl/core/schema';
import type {
  DataSource,
  DataSourceOptions,
  TableReference,
  TableDiscoverySource,
  TableMetadata,
  TableScanSource,
  TableSourceCollection
} from '@loaders.gl/core/loader-utils';
import {validateTableReference} from '@loaders.gl/core/loader-utils';
import {createSourceRegistry} from './resolve-query-source';

/** Portable logical metadata commands, independent of SQL parsing and execution controls. */
export type SQLCatalogQuery = Readonly<
  | {
      /** Lists locally registered source names. */
      command: 'showSources';
    }
  | {
      /** Lists discoverable tables in registration order. */
      command: 'showTables';
      /** Optional exact source name; omission discovers every registered source. */
      from?: string;
    }
  | {
      /** Describes the fields of one table. */
      command: 'describe';
      /** Literal source name, or separate source and loaded table names. */
      from: TableReference;
    }
>;

/** One locally registered source, available without metadata I/O. */
export type SQLCatalogSource = Readonly<{
  /** Stable DataSource.name. */
  name: string;
}>;

/** One discovered table with its actual logical FROM reference. */
export type SQLCatalogTable = TableMetadata &
  Readonly<{
    /** Parent DataSource.name. */
    sourceName: string;
    /** Literal or qualified reference used by the query API. */
    reference: TableReference;
    /** Whether the provider advertises table query support. */
    queryable: boolean;
  }>;

/** Lazy schema model shared by SQL commands and schema explorer applications. */
export interface SQLCatalog {
  /** Lists registered source names without contacting them. */
  getSources(): readonly SQLCatalogSource[];
  /** Discovers tables only in the requested source, or all sources in registration order. */
  getTables(
    sourceName?: string,
    options?: {signal?: AbortSignal}
  ): Promise<readonly SQLCatalogTable[]>;
  /** Discovers one table's portable schema without calling read() or getTable(). */
  getSchema(reference: TableReference, options?: {signal?: AbortSignal}): Promise<Schema>;
}

/** Creates a lazy metadata catalog over caller-owned sources; it does not open or close them. */
export function createSQLCatalog(
  sources: readonly DataSource<unknown, DataSourceOptions>[]
): SQLCatalog {
  const registry = createSourceRegistry(sources);
  const names = Object.freeze([...registry.keys()].map(name => Object.freeze({name})));
  /** Looks up exact names without falling back to a default source. */
  function getSource(name: string) {
    const source = registry.get(name);
    if (!source) throw new Error(`Unknown data source: ${name}`);
    return source;
  }
  /** Adapts one source's metadata discovery without reading table rows. */
  async function getTables(
    sourceName?: string,
    options: {signal?: AbortSignal} = {}
  ): Promise<readonly SQLCatalogTable[]> {
    options.signal?.throwIfAborted();
    const selected = sourceName === undefined ? [...registry.values()] : [getSource(sourceName)];
    const result: SQLCatalogTable[] = [];
    for (const source of selected) {
      options.signal?.throwIfAborted();
      const discovery = source as unknown as Partial<
        TableDiscoverySource & TableSourceCollection & TableScanSource
      >;
      if (typeof discovery.getTablesMetadata === 'function') {
        const tables = await discovery.getTablesMetadata(options);
        options.signal?.throwIfAborted();
        const tableNames = new Set<string>();
        if (!Array.isArray(tables)) throw new Error('Table discovery must return an array.');
        for (const table of tables) {
          if (
            !table ||
            typeof table.name !== 'string' ||
            !table.name.trim() ||
            tableNames.has(table.name)
          )
            throw new Error('Table metadata requires unique non-empty names.');
          if (table.queryable !== undefined && typeof table.queryable !== 'boolean')
            throw new Error('Table metadata queryable must be a boolean.');
          tableNames.add(table.name);
          result.push({
            ...table,
            sourceName: source.name,
            reference: {source: source.name, table: table.name},
            queryable: table.queryable ?? typeof discovery.getTable === 'function'
          });
        }
      } else if (typeof discovery.getQueryMetadata === 'function') {
        const metadata = await discovery.getQueryMetadata(options);
        options.signal?.throwIfAborted();
        if (metadata.queryType === 'table')
          result.push({
            name: source.name,
            sourceName: source.name,
            reference: source.name,
            schema: metadata.schema,
            queryable:
              typeof discovery.read === 'function' &&
              metadata.execution.status === 'supported' &&
              metadata.execution.method === 'read'
          });
      }
    }
    return result;
  }
  /** Resolves schemas through metadata APIs, never by opening a child table. */
  async function getSchema(
    reference: TableReference,
    options: {signal?: AbortSignal} = {}
  ): Promise<Schema> {
    validateTableReference(reference);
    if (reference === undefined) throw new Error('A table reference is required.');
    options.signal?.throwIfAborted();
    const sourceName = typeof reference === 'string' ? reference : reference.source;
    const source = getSource(sourceName);
    const discovery = source as unknown as Partial<TableDiscoverySource & TableScanSource>;
    let schema: Schema | undefined;
    if (typeof reference === 'string') {
      if (typeof discovery.getTablesMetadata === 'function')
        throw new Error(
          `DESCRIBE requires a qualified table reference for collection ${sourceName}.`
        );
      if (typeof discovery.getQueryMetadata === 'function') {
        const metadata = await discovery.getQueryMetadata(options);
        if (metadata.queryType === 'table') schema = metadata.schema;
      }
    } else if (typeof discovery.getTableMetadata === 'function') {
      schema = (await discovery.getTableMetadata(reference.table, options)).schema;
    } else {
      schema = (await getTables(sourceName, options)).find(
        table => typeof table.reference === 'object' && table.name === reference.table
      )?.schema;
    }
    options.signal?.throwIfAborted();
    if (!schema) throw new Error(`No discoverable table schema: ${sourceName}`);
    return schema;
  }
  return Object.freeze({getSources: () => names, getTables, getSchema});
}
