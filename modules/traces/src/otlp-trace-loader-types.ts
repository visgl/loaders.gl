// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';

import type {OtlpTrace, OtlpTraceBatch} from './otlp-trace-arrow-schema';

/** Shared options for OTLP trace loaders. */
export type OtlpTraceLoaderOptions = LoaderOptions & {
  otlpTrace?: {
    /** Maximum rows emitted in one tagged Arrow record batch. */
    batchSize?: number;
  };
};

/** Default OTLP trace loader options. */
export const OTLP_TRACE_LOADER_OPTIONS = {
  otlpTrace: {batchSize: 4096}
} as const satisfies OtlpTraceLoaderOptions;

/** OTLP protobuf trace metadata and lazy parser entrypoint. */
export const OtlpTraceLoader = {
  name: 'OTLP Trace Loader',
  id: 'otlpTrace',
  module: 'traces',
  version: 'latest',
  extensions: ['otlp', 'otlp-trace'],
  mimeTypes: ['application/x-protobuf', 'application/vnd.google.protobuf'],
  binary: true,
  dataType: null as unknown as OtlpTrace,
  batchType: null as unknown as OtlpTraceBatch,
  options: OTLP_TRACE_LOADER_OPTIONS,
  preload: preloadOtlpTraceLoader
} as const satisfies Loader<OtlpTrace, OtlpTraceBatch, OtlpTraceLoaderOptions>;

/** OTLP protobuf-JSON/JSONL trace metadata and lazy parser entrypoint. */
export const OtlpTraceJsonLoader = {
  name: 'OTLP Trace JSON Loader',
  id: 'otlpTraceJson',
  module: 'traces',
  version: 'latest',
  extensions: ['otlp.json', 'otlp.jsonl'],
  mimeTypes: ['application/json', 'application/jsonl', 'application/x-ndjson'],
  text: true,
  dataType: null as unknown as OtlpTrace,
  batchType: null as unknown as OtlpTraceBatch,
  options: OTLP_TRACE_LOADER_OPTIONS,
  preload: preloadOtlpTraceJsonLoader
} as const satisfies Loader<OtlpTrace, OtlpTraceBatch, OtlpTraceLoaderOptions>;

/** Loads the parser-bearing OTLP protobuf loader. */
async function preloadOtlpTraceLoader() {
  const {OtlpTraceLoaderWithParser} = await import('@loaders.gl/traces/otlp-trace-loader');
  return OtlpTraceLoaderWithParser;
}

/** Loads the parser-bearing OTLP JSON loader. */
async function preloadOtlpTraceJsonLoader() {
  const {OtlpTraceJsonLoaderWithParser} = await import('@loaders.gl/traces/otlp-trace-json-loader');
  return OtlpTraceJsonLoaderWithParser;
}
