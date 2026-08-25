// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';

import type {OtlpTrace, OtlpTraceBatch} from './otlp-trace-arrow-schema';

/** Options for the Zipkin v2 JSON trace loader. */
export type ZipkinTraceLoaderOptions = LoaderOptions & {
  zipkinTrace?: {
    /** Maximum rows emitted in one tagged Arrow record batch. */
    batchSize?: number;
  };
};

/** Default Zipkin v2 JSON trace loader options. */
export const ZIPKIN_TRACE_LOADER_OPTIONS = {
  zipkinTrace: {batchSize: 4096}
} as const satisfies ZipkinTraceLoaderOptions;

/** Zipkin v2 JSON trace metadata and lazy parser entrypoint. */
export const ZipkinTraceLoader = {
  name: 'Zipkin Trace Loader',
  id: 'zipkinTrace',
  module: 'traces',
  version: 'latest',
  extensions: ['zipkin.json', 'zipkin.jsonl'],
  mimeTypes: ['application/json', 'application/jsonl', 'application/x-ndjson'],
  text: true,
  dataType: null as unknown as OtlpTrace,
  batchType: null as unknown as OtlpTraceBatch,
  options: ZIPKIN_TRACE_LOADER_OPTIONS,
  preload: preloadZipkinTraceLoader
} as const satisfies Loader<OtlpTrace, OtlpTraceBatch, ZipkinTraceLoaderOptions>;

/** Loads the parser-bearing Zipkin v2 JSON loader. */
async function preloadZipkinTraceLoader() {
  const {ZipkinTraceLoaderWithParser} = await import('@loaders.gl/traces/zipkin-trace-loader');
  return ZipkinTraceLoaderWithParser;
}
