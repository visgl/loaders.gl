// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable} from '@loaders.gl/schema';
import {
  explainArrowTableQuery,
  queryArrowTable,
  type ArrowQueryOptions,
  type SQLPredicate
} from '@loaders.gl/sql';
import type {TableQueryExplain} from '@loaders.gl/loader-utils';

/** Names accepted by the optional scan engine factory. */
export type ScanBackendName = 'arrow' | (string & {});

/** A backend implementation for the Arrow table query surface. */
export type ScanBackend = Readonly<{
  /** Stable backend name reported by the engine. */
  name: ScanBackendName;
  /** Executes a query over one in-memory Arrow table. */
  query(sourceTable: ArrowTable, options?: ArrowQueryOptions): ArrowTable;
  /** Optional asynchronous execution hook for backends that compile or schedule work. */
  queryAsync?: (sourceTable: ArrowTable, options?: ArrowQueryOptions) => Promise<ArrowTable>;
  /** Explains a query without evaluating table rows. */
  explain(sourceTable: ArrowTable, options?: ArrowQueryOptions): TableQueryExplain<SQLPredicate>;
}>;

/** Lazy loader used to register an optional scan backend. */
export type ScanBackendLoader = () => ScanBackend | Promise<ScanBackend>;

/** Options for creating a scan engine. */
export type ScanEngineOptions = Readonly<{
  /** Backend to use. Arrow is the built-in reference backend. */
  backend?: ScanBackendName;
}>;

/** Stable application-facing scan engine returned by {@link createScanEngine}. */
export type ScanEngine = ScanBackend & {
  /** Executes a query asynchronously, allowing backends to schedule remote or compiled work. */
  queryAsync: (sourceTable: ArrowTable, options?: ArrowQueryOptions) => Promise<ArrowTable>;
};

const scanBackends = new Map<ScanBackendName, ScanBackend | ScanBackendLoader>();

/** Executes the built-in Arrow backend through its asynchronous interface. */
async function queryArrowTableAsync(
  sourceTable: ArrowTable,
  options?: ArrowQueryOptions
): Promise<ArrowTable> {
  return queryArrowTable(sourceTable, options);
}

const arrowScanBackend: ScanBackend = Object.freeze({
  name: 'arrow',
  query: queryArrowTable,
  queryAsync: queryArrowTableAsync,
  explain: explainArrowTableQuery
});

// Store the built-in backend directly. Apart from avoiding needless indirection, this keeps
// coverage stable when browser shards transform this shared module independently.
scanBackends.set('arrow', arrowScanBackend);

/**
 * Registers a lazy scan backend without adding it to the default bundle.
 *
 * This is the extension point for future DuckDB and GPU implementations. The backend package can
 * register a dynamic loader from application code while the public import remains
 * `@loaders.gl/scan`.
 */
export function registerScanBackend(name: ScanBackendName, loader: ScanBackendLoader): void {
  if (!name || !loader) {
    throw new Error('A scan backend name and loader are required');
  }
  scanBackends.set(name, loader);
}

/**
 * Creates the configured scan engine.
 *
 * The factory is asynchronous even for Arrow so optional backends can be loaded lazily later
 * without changing the application-facing API.
 */
export async function createScanEngine(options: ScanEngineOptions = {}): Promise<ScanEngine> {
  const backendName = options.backend || 'arrow';
  const registeredBackend = scanBackends.get(backendName);
  if (!registeredBackend) {
    throw new Error(
      `Scan backend "${backendName}" is not registered. The built-in backend is "arrow".`
    );
  }
  const backend =
    typeof registeredBackend === 'function' ? await registeredBackend() : registeredBackend;
  if (backend.name !== backendName) {
    throw new Error(
      `Scan backend loader returned "${backend.name}" while "${backendName}" was requested.`
    );
  }
  const query = backend.query.bind(backend);
  const explain = backend.explain.bind(backend);
  const queryAsync = backend.queryAsync
    ? backend.queryAsync.bind(backend)
    : async (sourceTable: ArrowTable, queryOptions?: ArrowQueryOptions) =>
        backend.query.call(backend, sourceTable, queryOptions);
  return Object.freeze({...backend, query, explain, queryAsync});
}
