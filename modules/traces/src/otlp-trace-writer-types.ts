// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {OtlpTrace} from './otlp-trace-arrow-schema';
import type {OtlpTraceWriterOptions} from './otlp-trace-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

/** Shared OtlpTraceWriter metadata and defaults. */
export const OTLP_TRACE_WRITER_METADATA = {
  name: 'OTLP Trace Writer',
  id: 'otlpTrace',
  module: 'traces',
  version: 'latest',
  extensions: ['otlp', 'otlp-trace'],
  mimeTypes: ['application/x-protobuf', 'application/vnd.google.protobuf'],
  binary: true,
  options: {}
} as const satisfies Writer<OtlpTrace, never, OtlpTraceWriterOptions>;

/** Metadata for encoding with OtlpTraceWriter through the core APIs. */
export const OtlpTraceWriter = {
  ...OTLP_TRACE_WRITER_METADATA,
  dataType: null as unknown as OtlpTrace,
  batchType: null as never,
  options: OTLP_TRACE_WRITER_METADATA.options as OtlpTraceWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {OtlpTraceWriter} = await import('./otlp-trace-writer.js');
    return OtlpTraceWriter;
  }
} as const satisfies Writer<OtlpTrace, never, OtlpTraceWriterOptions>;
