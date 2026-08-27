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

/** A backend implementation for the proof-of-concept Arrow table surface. */
export type ScanBackend = Readonly<{
  /** Stable backend name reported by the engine. */
  name: ScanBackendName;
  /** Executes a query over one in-memory Arrow table. */
  query(sourceTable: ArrowTable, options?: ArrowQueryOptions): ArrowTable;
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
export type ScanEngine = ScanBackend;

const scanBackendLoaders = new Map<ScanBackendName, ScanBackendLoader>();

const arrowScanBackend: ScanBackend = Object.freeze({
  name: 'arrow',
  query: queryArrowTable,
  explain: explainArrowTableQuery
});

scanBackendLoaders.set('arrow', () => arrowScanBackend);

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
  scanBackendLoaders.set(name, loader);
}

/**
 * Creates the configured scan engine.
 *
 * The factory is asynchronous even for Arrow so optional backends can be loaded lazily later
 * without changing the application-facing API.
 */
export async function createScanEngine(options: ScanEngineOptions = {}): Promise<ScanEngine> {
  const backendName = options.backend || 'arrow';
  const loader = scanBackendLoaders.get(backendName);
  if (!loader) {
    throw new Error(
      `Scan backend "${backendName}" is not registered. The proof of concept includes "arrow".`
    );
  }
  const backend = await loader();
  if (backend.name !== backendName) {
    throw new Error(
      `Scan backend loader returned "${backend.name}" while "${backendName}" was requested.`
    );
  }
  return backend;
}
