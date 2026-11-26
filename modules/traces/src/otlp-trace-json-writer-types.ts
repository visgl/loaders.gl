// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {OtlpTrace} from './otlp-trace-arrow-schema';
import type {OtlpTraceJsonWriterOptions} from './otlp-trace-json-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

/** Shared OtlpTraceJsonWriter metadata and defaults. */
export const OTLP_TRACE_JSON_WRITER_METADATA = {
  name: 'OTLP Trace JSON Writer',
  id: 'otlpTraceJson',
  module: 'traces',
  version: 'latest',
  extensions: ['otlp.json'],
  mimeTypes: ['application/json'],
  text: true,
  options: {}
} as const satisfies Writer<OtlpTrace, never, OtlpTraceJsonWriterOptions>;

/** Metadata for encoding with OtlpTraceJsonWriter through the core APIs. */
export const OtlpTraceJsonWriter = {
  ...OTLP_TRACE_JSON_WRITER_METADATA,
  dataType: null as unknown as OtlpTrace,
  batchType: null as never,
  options: OTLP_TRACE_JSON_WRITER_METADATA.options as OtlpTraceJsonWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {OtlpTraceJsonWriter} = await import('./otlp-trace-json-writer.js');
    return OtlpTraceJsonWriter;
  }
} as const satisfies Writer<OtlpTrace, never, OtlpTraceJsonWriterOptions>;
