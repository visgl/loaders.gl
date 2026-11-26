// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {OtlpTrace} from './otlp-trace-arrow-schema';
import type {ZipkinTraceWriterOptions} from './zipkin-trace-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

/** Shared ZipkinTraceWriter metadata and defaults. */
export const ZIPKIN_TRACE_WRITER_METADATA = {
  name: 'Zipkin Trace Writer',
  id: 'zipkinTrace',
  module: 'traces',
  version: 'latest',
  extensions: ['zipkin.json'],
  mimeTypes: ['application/json'],
  text: true,
  options: {}
} as const satisfies Writer<OtlpTrace, never, ZipkinTraceWriterOptions>;

/** Metadata for encoding with ZipkinTraceWriter through the core APIs. */
export const ZipkinTraceWriter = {
  ...ZIPKIN_TRACE_WRITER_METADATA,
  dataType: null as unknown as OtlpTrace,
  batchType: null as never,
  options: ZIPKIN_TRACE_WRITER_METADATA.options as ZipkinTraceWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {ZipkinTraceWriter} = await import('./zipkin-trace-writer.js');
    return ZipkinTraceWriter;
  }
} as const satisfies Writer<OtlpTrace, never, ZipkinTraceWriterOptions>;
