// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {toJson} from '@bufbuild/protobuf';
import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';

import {ExportTraceServiceRequestSchema} from './otlp-proto/generated/opentelemetry/proto/collector/trace/v1/trace_service_pb';
import type {OtlpTrace} from './otlp-trace-arrow-schema';
import {buildOtlpTracesData} from './otlp-trace-message';
import {convertProtobufJsonIdsToOtlp} from './otlp-json';
import type {ZipkinEndpoint, ZipkinSpan} from './zipkin-trace-types';

/** Zipkin v2 JSON writer options. */
export type ZipkinTraceWriterOptions = WriterOptions & {
  zipkinTrace?: {
    /** Emit a span array or a list of trace arrays. */
    shape?: 'spans' | 'traces';
    /** Number of spaces used to indent JSON output. */
    space?: number;
  };
};

/** Serializes normalized OTLP Arrow tables as Zipkin v2 JSON. */
export const ZipkinTraceWriter = {
  name: 'Zipkin Trace Writer',
  id: 'zipkinTrace',
  module: 'traces',
  version: 'latest',
  extensions: ['zipkin.json'],
  mimeTypes: ['application/json'],
  text: true,
  options: {},
  encode: async (trace: OtlpTrace, options?: ZipkinTraceWriterOptions) =>
    encodeZipkinTrace(trace, options),
  encodeSync: (trace: OtlpTrace, options?: ZipkinTraceWriterOptions) =>
    encodeZipkinTrace(trace, options),
  encodeText: async (trace: OtlpTrace, options?: ZipkinTraceWriterOptions) =>
    encodeZipkinTraceText(trace, options),
  encodeTextSync: encodeZipkinTraceText
} as const satisfies WriterWithEncoder<OtlpTrace, never, ZipkinTraceWriterOptions>;

/** Encodes one normalized Arrow trace as UTF-8 Zipkin JSON bytes. */
function encodeZipkinTrace(trace: OtlpTrace, options?: ZipkinTraceWriterOptions): ArrayBuffer {
  const bytes = new TextEncoder().encode(encodeZipkinTraceText(trace, options));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/** Encodes one normalized Arrow trace as Zipkin v2 JSON text. */
function encodeZipkinTraceText(trace: OtlpTrace, options?: ZipkinTraceWriterOptions): string {
  const protobufJson = toJson(ExportTraceServiceRequestSchema, buildOtlpTracesData(trace), {
    enumAsInteger: true,
    alwaysEmitImplicit: true
  });
  const otlpJson = convertProtobufJsonIdsToOtlp(protobufJson) as Record<string, unknown>;
  const spans = convertOtlpJsonToZipkin(otlpJson);
  const output = options?.zipkinTrace?.shape === 'traces' ? groupSpansByTrace(spans) : spans;
  return JSON.stringify(output, null, options?.zipkinTrace?.space);
}

/** Converts canonical OTLP protobuf-JSON into Zipkin spans. */
function convertOtlpJsonToZipkin(value: Record<string, unknown>): ZipkinSpan[] {
  const spans: ZipkinSpan[] = [];
  for (const resourceSpanValue of readArray(value.resourceSpans)) {
    const resourceSpan = readRecord(resourceSpanValue);
    const resource = readRecord(resourceSpan.resource);
    const localEndpoint = readLocalEndpoint(readAttributes(resource.attributes));
    for (const scopeSpanValue of readArray(resourceSpan.scopeSpans)) {
      const scopeSpan = readRecord(scopeSpanValue);
      for (const spanValue of readArray(scopeSpan.spans)) {
        spans.push(convertOtlpSpan(readRecord(spanValue), localEndpoint));
      }
    }
  }
  return spans;
}

/** Converts one OTLP span into Zipkin v2 JSON. */
function convertOtlpSpan(span: Record<string, unknown>, localEndpoint: ZipkinEndpoint): ZipkinSpan {
  const attributes = readAttributes(span.attributes);
  const remoteEndpoint = readRemoteEndpoint(attributes);
  const tags: Record<string, string> = {};
  for (const [key, value] of attributes) {
    if (!key.startsWith('zipkin.remote.') && key !== 'zipkin.debug' && key !== 'zipkin.shared') {
      tags[key] = String(value);
    }
  }
  const status = readRecord(span.status);
  if (Number(status.code ?? 0) === 2 && tags.error === undefined) {
    tags.error = readString(status.message) || 'true';
  }
  const traceId = readString(span.traceId).replace(/^0{16}(?=[\da-f]{16}$)/, '');
  const startTime = nanosecondsToMicroseconds(span.startTimeUnixNano);
  const endTime = nanosecondsToMicroseconds(span.endTimeUnixNano);
  const kind = ['', '', 'SERVER', 'CLIENT', 'PRODUCER', 'CONSUMER'][Number(span.kind ?? 0)] as
    | ZipkinSpan['kind']
    | undefined;
  return {
    traceId,
    id: readString(span.spanId),
    ...(typeof span.parentSpanId === 'string' && span.parentSpanId
      ? {parentId: span.parentSpanId}
      : {}),
    name: readString(span.name),
    ...(kind ? {kind} : {}),
    timestamp: startTime,
    duration: endTime - startTime,
    ...(Object.keys(localEndpoint).length ? {localEndpoint} : {}),
    ...(Object.keys(remoteEndpoint).length ? {remoteEndpoint} : {}),
    annotations: readArray(span.events).map(eventValue => {
      const event = readRecord(eventValue);
      return {
        timestamp: nanosecondsToMicroseconds(event.timeUnixNano),
        value: readString(event.name)
      };
    }),
    tags,
    ...readBooleanAttribute(attributes, 'zipkin.debug', 'debug'),
    ...readBooleanAttribute(attributes, 'zipkin.shared', 'shared')
  };
}

/** Groups spans into the Zipkin ListOfTraces response shape. */
function groupSpansByTrace(spans: ZipkinSpan[]): ZipkinSpan[][] {
  const traces = new Map<string, ZipkinSpan[]>();
  for (const span of spans) {
    const trace = traces.get(span.traceId) ?? [];
    trace.push(span);
    traces.set(span.traceId, trace);
  }
  return [...traces.values()];
}

/** Reads local endpoint fields from OTLP resource attributes. */
function readLocalEndpoint(attributes: Map<string, unknown>): ZipkinEndpoint {
  const address = attributes.get('server.address');
  return compactEndpoint({
    serviceName: readOptionalString(attributes.get('service.name')),
    ...(typeof address === 'string' && address.includes(':')
      ? {ipv6: address}
      : {ipv4: readOptionalString(address)}),
    port: readOptionalNumber(attributes.get('server.port'))
  });
}

/** Reads remote endpoint fields from OTLP span attributes. */
function readRemoteEndpoint(attributes: Map<string, unknown>): ZipkinEndpoint {
  return compactEndpoint({
    serviceName: readOptionalString(attributes.get('zipkin.remote.service_name')),
    ipv4: readOptionalString(attributes.get('zipkin.remote.ipv4')),
    ipv6: readOptionalString(attributes.get('zipkin.remote.ipv6')),
    port: readOptionalNumber(attributes.get('zipkin.remote.port'))
  });
}

/** Removes undefined fields from an endpoint. */
function compactEndpoint(endpoint: ZipkinEndpoint): ZipkinEndpoint {
  return Object.fromEntries(
    Object.entries(endpoint).filter(([, value]) => value !== undefined)
  ) as ZipkinEndpoint;
}

/** Reads a boolean compatibility attribute into one optional output property. */
function readBooleanAttribute<Key extends 'debug' | 'shared'>(
  attributes: Map<string, unknown>,
  attributeName: string,
  key: Key
): Partial<Pick<ZipkinSpan, Key>> {
  const value = attributes.get(attributeName);
  return typeof value === 'boolean' ? ({[key]: value} as Pick<ZipkinSpan, Key>) : {};
}

/** Decodes OTLP KeyValue JSON into a key-value map. */
function readAttributes(value: unknown): Map<string, unknown> {
  return new Map(
    readArray(value).map(item => {
      const keyValue = readRecord(item);
      const anyValue = readRecord(keyValue.value);
      const result =
        anyValue.stringValue ??
        anyValue.boolValue ??
        anyValue.intValue ??
        anyValue.doubleValue ??
        anyValue.bytesValue ??
        '';
      return [readString(keyValue.key), result];
    })
  );
}

/** Converts an OTLP nanosecond integer into safe integer microseconds. */
function nanosecondsToMicroseconds(value: unknown): number {
  const result = Number(BigInt(readString(value)) / 1000n);
  if (!Number.isSafeInteger(result)) {
    throw new Error('Zipkin JSON cannot represent this OTLP timestamp as safe microseconds.');
  }
  return result;
}

/** Reads a JSON array, treating absent repeated fields as empty. */
function readArray(value: unknown): unknown[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error('Expected an array while converting OTLP data to Zipkin JSON.');
  }
  return value;
}

/** Reads one required JSON object. */
function readRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected an object while converting OTLP data to Zipkin JSON.');
  }
  return value as Record<string, unknown>;
}

/** Reads one required JSON string. */
function readString(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Expected a string while converting OTLP data to Zipkin JSON.');
  }
  return value;
}

/** Reads one optional string value. */
function readOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Reads one optional finite number or integer string. */
function readOptionalNumber(value: unknown): number | undefined {
  const number = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN;
  return Number.isFinite(number) ? number : undefined;
}
