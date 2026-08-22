// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';

import type {
  ChromeTraceEventArrowTable,
  ChromeTraceEventStreamArrowRecordBatch
} from './chrome-trace-arrow-schema';
import type {ChromeTraceFileSchema, ChromeTraceValidationOptions} from './chrome-trace-schema';

/** Chrome trace loader options. */
export type ChromeTraceLoaderOptions = LoaderOptions &
  ChromeTraceValidationOptions & {
    /** Selects the returned data shape for whole-file parsing. */
    shape?: 'json' | 'arrow-table';
    /** Chrome trace loader-specific options. */
    chromeTrace?: {
      /** Selects the returned data shape for whole-file parsing. */
      shape?: 'json' | 'arrow-table';
      /** Maximum number of events emitted in one Arrow record batch. */
      batchSize?: number;
    };
  };

/** Default Chrome trace loader options. */
export const CHROME_TRACE_LOADER_OPTIONS = {
  chromeTrace: {
    shape: 'json',
    batchSize: 256
  }
} as const satisfies ChromeTraceLoaderOptions;

/** Chrome Trace Event JSON format metadata and lazy parser entrypoint. */
export const ChromeTraceLoader = {
  name: 'Chrome Trace Loader',
  id: 'chromeTrace',
  module: 'traces',
  version: 'latest',
  extensions: ['json'],
  mimeTypes: ['application/json', 'application/x-chrome-trace+json'],
  text: true,
  dataType: null as unknown as ChromeTraceFileSchema | ChromeTraceEventArrowTable,
  batchType: null as unknown as ChromeTraceEventStreamArrowRecordBatch,
  options: CHROME_TRACE_LOADER_OPTIONS,
  tests: [testChromeTraceLoader],
  preload
} as const satisfies Loader<
  ChromeTraceFileSchema | ChromeTraceEventArrowTable,
  ChromeTraceEventStreamArrowRecordBatch,
  ChromeTraceLoaderOptions
>;

/** Loads the parser-bearing Chrome trace loader. */
async function preload() {
  const {ChromeTraceLoaderWithParser} = await import('@loaders.gl/traces/chrome-trace-loader');
  return ChromeTraceLoaderWithParser;
}

/** Sniffs a candidate file header for a Chrome trace container. */
function testChromeTraceLoader(arrayBuffer: ArrayBuffer): boolean {
  const header = new TextDecoder().decode(new Uint8Array(arrayBuffer).slice(0, 2048));
  return header.includes('"traceEvents"');
}
