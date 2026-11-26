// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {OtlpTrace} from './otlp-trace-arrow-schema';
import type {JaegerTraceWriterOptions} from './jaeger-trace-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

/** Shared JaegerTraceWriter metadata and defaults. */
export const JAEGER_TRACE_WRITER_METADATA = {
  name: 'Jaeger Trace Writer',
  id: 'jaegerTrace',
  module: 'traces',
  version: 'latest',
  extensions: ['jaeger.json'],
  mimeTypes: ['application/json'],
  text: true,
  options: {}
} as const satisfies Writer<OtlpTrace, never, JaegerTraceWriterOptions>;

/** Metadata for encoding with JaegerTraceWriter through the core APIs. */
export const JaegerTraceWriter = {
  ...JAEGER_TRACE_WRITER_METADATA,
  dataType: null as unknown as OtlpTrace,
  batchType: null as never,
  options: JAEGER_TRACE_WRITER_METADATA.options as JaegerTraceWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {JaegerTraceWriter} = await import('./jaeger-trace-writer.js');
    return JaegerTraceWriter;
  }
} as const satisfies Writer<OtlpTrace, never, JaegerTraceWriterOptions>;
