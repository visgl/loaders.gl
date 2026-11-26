// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ChromeTraceArrowSourceItem} from './chrome-trace-arrow-adapter';
import type {ChromeTraceWriterOptions} from './chrome-trace-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

/** Shared ChromeTraceWriter metadata and defaults. */
export const CHROME_TRACE_WRITER_METADATA = {
  name: 'Chrome Trace Writer',
  id: 'chromeTrace',
  module: 'traces',
  version: 'latest',
  extensions: ['json'],
  mimeTypes: ['application/json', 'application/x-chrome-trace+json'],
  text: true,
  options: {}
} as const satisfies Writer<ChromeTraceArrowSourceItem, never, ChromeTraceWriterOptions>;

/** Metadata for encoding with ChromeTraceWriter through the core APIs. */
export const ChromeTraceWriter = {
  ...CHROME_TRACE_WRITER_METADATA,
  dataType: null as unknown as ChromeTraceArrowSourceItem,
  batchType: null as never,
  options: CHROME_TRACE_WRITER_METADATA.options as ChromeTraceWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {ChromeTraceWriter} = await import('./chrome-trace-writer.js');
    return ChromeTraceWriter;
  }
} as const satisfies Writer<ChromeTraceArrowSourceItem, never, ChromeTraceWriterOptions>;
