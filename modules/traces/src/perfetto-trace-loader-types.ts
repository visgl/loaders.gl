// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';

import type {PerfettoTrace, PerfettoTraceBatch} from './perfetto-trace-arrow-schema';
import {testPerfettoTrace} from './perfetto-trace-detector';

/** Perfetto protobuf trace loader options. */
export type PerfettoTraceLoaderOptions = LoaderOptions & {
  perfettoTrace?: {
    /** Maximum rows emitted in one tagged Arrow record batch. */
    batchSize?: number;
    /** Maximum number of incremental-state entries retained per parser. */
    maxStateEntries?: number;
    /** Maximum number of unmatched begin events retained per parser. */
    maxOpenSlices?: number;
  };
};

/** Default Perfetto trace loader options. */
export const PERFETTO_TRACE_LOADER_OPTIONS = {
  perfettoTrace: {batchSize: 4096}
} as const satisfies PerfettoTraceLoaderOptions;

/** Perfetto protobuf format metadata and lazy parser entrypoint. */
export const PerfettoTraceLoader = {
  name: 'Perfetto Trace Loader',
  id: 'perfettoTrace',
  module: 'traces',
  version: 'latest',
  extensions: ['perfetto-trace', 'pftrace'],
  mimeTypes: ['application/x-perfetto-trace', 'application/vnd.google.protobuf'],
  binary: true,
  dataType: null as unknown as PerfettoTrace,
  batchType: null as unknown as PerfettoTraceBatch,
  options: PERFETTO_TRACE_LOADER_OPTIONS,
  tests: [testPerfettoTrace],
  preload
} as const satisfies Loader<PerfettoTrace, PerfettoTraceBatch, PerfettoTraceLoaderOptions>;

/** Loads the parser-bearing Perfetto trace loader. */
async function preload() {
  const {PerfettoTraceLoaderWithParser} = await import('@loaders.gl/traces/perfetto-trace-loader');
  return PerfettoTraceLoaderWithParser;
}
