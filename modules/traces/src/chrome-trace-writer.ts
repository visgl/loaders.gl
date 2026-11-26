// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/core/loader-utils';

import {
  decodeChromeTraceArrowSource,
  readChromeTraceArrowSourceMetadata,
  type ChromeTraceArrowSourceItem
} from './chrome-trace-arrow-adapter';
import type {ChromeTraceFileSchema} from './chrome-trace-schema';
import {CHROME_TRACE_WRITER_METADATA} from './chrome-trace-writer-types';

/** Chrome trace writer options. */
export type ChromeTraceWriterOptions = WriterOptions & {
  chromeTrace?: {
    /** Optional display time unit overriding Arrow schema metadata. */
    displayTimeUnit?: string;
    /** Optional top-level metadata overriding Arrow schema metadata. */
    metadata?: Record<string, unknown>;
  };
};

/** Serializes Chrome trace event Arrow data as Chrome Trace Event JSON. */
export const ChromeTraceWriter = {
  ...CHROME_TRACE_WRITER_METADATA,
  encode: async (source: ChromeTraceArrowSourceItem, options?: ChromeTraceWriterOptions) =>
    encodeChromeTrace(source, options),
  encodeSync: encodeChromeTrace,
  encodeText: async (source: ChromeTraceArrowSourceItem, options?: ChromeTraceWriterOptions) =>
    encodeChromeTraceText(source, options),
  encodeTextSync: encodeChromeTraceText
} as const satisfies WriterWithEncoder<ChromeTraceArrowSourceItem, never, ChromeTraceWriterOptions>;

/** Encodes Chrome trace event Arrow data as UTF-8 JSON bytes. */
function encodeChromeTrace(
  source: ChromeTraceArrowSourceItem,
  options?: ChromeTraceWriterOptions
): ArrayBuffer {
  const bytes = new TextEncoder().encode(encodeChromeTraceText(source, options));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/** Encodes Chrome trace event Arrow data as JSON text. */
function encodeChromeTraceText(
  source: ChromeTraceArrowSourceItem,
  options?: ChromeTraceWriterOptions
): string {
  const schemaMetadata = readChromeTraceArrowSourceMetadata(source);
  const displayTimeUnit = options?.chromeTrace?.displayTimeUnit ?? schemaMetadata.displayTimeUnit;
  const metadata = options?.chromeTrace?.metadata ?? schemaMetadata.metadata;
  const traceFile: ChromeTraceFileSchema = {
    traceEvents: decodeChromeTraceArrowSource(source),
    ...(displayTimeUnit ? {displayTimeUnit} : {}),
    ...(metadata ? {metadata} : {})
  };

  return JSON.stringify(traceFile);
}
