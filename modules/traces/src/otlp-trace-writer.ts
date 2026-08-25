// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {toBinary} from '@bufbuild/protobuf';
import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';

import {ExportTraceServiceRequestSchema} from './otlp-proto/generated/opentelemetry/proto/collector/trace/v1/trace_service_pb';
import type {OtlpTrace} from './otlp-trace-arrow-schema';
import {buildOtlpTracesData} from './otlp-trace-message';

/** OTLP protobuf writer options. */
export type OtlpTraceWriterOptions = WriterOptions & {
  otlpTrace?: Record<string, never>;
};

/** Serializes normalized Arrow tables as a canonical OTLP trace export request. */
export const OtlpTraceWriter = {
  name: 'OTLP Trace Writer',
  id: 'otlpTrace',
  module: 'traces',
  version: 'latest',
  extensions: ['otlp', 'otlp-trace'],
  mimeTypes: ['application/x-protobuf', 'application/vnd.google.protobuf'],
  binary: true,
  options: {},
  encode: async (trace: OtlpTrace) => encodeOtlpTrace(trace),
  encodeSync: encodeOtlpTrace
} as const satisfies WriterWithEncoder<OtlpTrace, never, OtlpTraceWriterOptions>;

/** Encodes one Arrow-backed trace as OTLP protobuf bytes. */
function encodeOtlpTrace(trace: OtlpTrace): ArrayBuffer {
  const bytes = toBinary(ExportTraceServiceRequestSchema, buildOtlpTracesData(trace));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
