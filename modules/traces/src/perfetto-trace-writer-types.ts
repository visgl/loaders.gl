// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PerfettoTrace} from './perfetto-trace-arrow-schema';
import type {PerfettoTraceWriterOptions} from './perfetto-trace-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

/** Shared PerfettoTraceWriter metadata and defaults. */
export const PERFETTO_TRACE_WRITER_METADATA = {
  name: 'Perfetto Trace Writer',
  id: 'perfettoTrace',
  module: 'traces',
  version: 'latest',
  extensions: ['perfetto-trace', 'pftrace'],
  mimeTypes: ['application/x-perfetto-trace', 'application/vnd.google.protobuf'],
  binary: true,
  options: {}
} as const satisfies Writer<PerfettoTrace, never, PerfettoTraceWriterOptions>;

/** Metadata for encoding with PerfettoTraceWriter through the core APIs. */
export const PerfettoTraceWriter = {
  ...PERFETTO_TRACE_WRITER_METADATA,
  dataType: null as unknown as PerfettoTrace,
  batchType: null as never,
  options: PERFETTO_TRACE_WRITER_METADATA.options as PerfettoTraceWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {PerfettoTraceWriter} = await import('./perfetto-trace-writer.js');
    return PerfettoTraceWriter;
  }
} as const satisfies Writer<PerfettoTrace, never, PerfettoTraceWriterOptions>;
