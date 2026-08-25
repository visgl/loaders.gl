// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';

import type {OtlpTrace, OtlpTraceBatch} from './otlp-trace-arrow-schema';

/** Options for the Jaeger JSON trace loader. */
export type JaegerTraceLoaderOptions = LoaderOptions & {
  jaegerTrace?: {
    /** Maximum rows emitted in one tagged Arrow record batch. */
    batchSize?: number;
  };
};

/** Default Jaeger JSON trace loader options. */
export const JAEGER_TRACE_LOADER_OPTIONS = {
  jaegerTrace: {batchSize: 4096}
} as const satisfies JaegerTraceLoaderOptions;

/** Jaeger JSON trace metadata and lazy parser entrypoint. */
export const JaegerTraceLoader = {
  name: 'Jaeger Trace Loader',
  id: 'jaegerTrace',
  module: 'traces',
  version: 'latest',
  extensions: ['jaeger.json', 'jaeger.jsonl'],
  mimeTypes: ['application/json', 'application/jsonl', 'application/x-ndjson'],
  text: true,
  dataType: null as unknown as OtlpTrace,
  batchType: null as unknown as OtlpTraceBatch,
  options: JAEGER_TRACE_LOADER_OPTIONS,
  preload: preloadJaegerTraceLoader
} as const satisfies Loader<OtlpTrace, OtlpTraceBatch, JaegerTraceLoaderOptions>;

/** Loads the parser-bearing Jaeger JSON loader. */
async function preloadJaegerTraceLoader() {
  const {JaegerTraceLoaderWithParser} = await import('@loaders.gl/traces/jaeger-trace-loader');
  return JaegerTraceLoaderWithParser;
}
