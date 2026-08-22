// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {toJson} from '@bufbuild/protobuf';
import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';

import {ExportTraceServiceRequestSchema} from './otlp-proto/generated/opentelemetry/proto/collector/trace/v1/trace_service_pb';
import type {OtlpTrace} from './otlp-trace-arrow-schema';
import {buildOtlpTracesData} from './otlp-trace-message';
import {convertProtobufJsonIdsToOtlp} from './otlp-json';

/** OTLP protobuf-JSON writer options. */
export type OtlpTraceJsonWriterOptions = WriterOptions & {
  otlpTraceJson?: {
    /** Number of spaces used to indent JSON output. */
    space?: number;
  };
};

/** Serializes normalized Arrow tables as canonical OTLP protobuf-JSON. */
export const OtlpTraceJsonWriter = {
  name: 'OTLP Trace JSON Writer',
  id: 'otlpTraceJson',
  module: 'traces',
  version: 'latest',
  extensions: ['otlp.json'],
  mimeTypes: ['application/json'],
  text: true,
  options: {},
  encode: async (trace: OtlpTrace, options?: OtlpTraceJsonWriterOptions) =>
    encodeOtlpTraceJson(trace, options),
  encodeSync: (trace: OtlpTrace, options?: OtlpTraceJsonWriterOptions) =>
    encodeOtlpTraceJson(trace, options),
  encodeText: async (trace: OtlpTrace, options?: OtlpTraceJsonWriterOptions) =>
    encodeOtlpTraceJsonText(trace, options),
  encodeTextSync: encodeOtlpTraceJsonText
} as const satisfies WriterWithEncoder<OtlpTrace, never, OtlpTraceJsonWriterOptions>;

/** Encodes one Arrow-backed trace as UTF-8 OTLP JSON bytes. */
function encodeOtlpTraceJson(trace: OtlpTrace, options?: OtlpTraceJsonWriterOptions): ArrayBuffer {
  const bytes = new TextEncoder().encode(encodeOtlpTraceJsonText(trace, options));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/** Encodes one Arrow-backed trace as OTLP protobuf-JSON text. */
function encodeOtlpTraceJsonText(trace: OtlpTrace, options?: OtlpTraceJsonWriterOptions): string {
  const protobufJson = toJson(ExportTraceServiceRequestSchema, buildOtlpTracesData(trace), {
    enumAsInteger: true
  });
  return JSON.stringify(
    convertProtobufJsonIdsToOtlp(protobufJson),
    null,
    options?.otlpTraceJson?.space
  );
}
