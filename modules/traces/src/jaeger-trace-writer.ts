// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {toJson} from '@bufbuild/protobuf';
import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';

import {ExportTraceServiceRequestSchema} from './otlp-proto/generated/opentelemetry/proto/collector/trace/v1/trace_service_pb';
import type {OtlpTrace} from './otlp-trace-arrow-schema';
import {buildOtlpTracesData} from './otlp-trace-message';
import {convertProtobufJsonIdsToOtlp} from './otlp-json';
import type {
  JaegerProcess,
  JaegerQueryResponse,
  JaegerSpan,
  JaegerSpanReference,
  JaegerTag,
  JaegerTrace
} from './jaeger-trace-types';

/** Jaeger JSON writer options. */
export type JaegerTraceWriterOptions = WriterOptions & {
  jaegerTrace?: {
    /** Output a Query API response or a raw embedded-process span array. */
    shape?: 'query' | 'spans';
    /** Number of spaces used to indent JSON output. */
    space?: number;
  };
};

/** Serializes normalized OTLP Arrow tables as Jaeger JSON. */
export const JaegerTraceWriter = {
  name: 'Jaeger Trace Writer',
  id: 'jaegerTrace',
  module: 'traces',
  version: 'latest',
  extensions: ['jaeger.json'],
  mimeTypes: ['application/json'],
  text: true,
  options: {},
  encode: async (trace: OtlpTrace, options?: JaegerTraceWriterOptions) =>
    encodeJaegerTrace(trace, options),
  encodeSync: (trace: OtlpTrace, options?: JaegerTraceWriterOptions) =>
    encodeJaegerTrace(trace, options),
  encodeText: async (trace: OtlpTrace, options?: JaegerTraceWriterOptions) =>
    encodeJaegerTraceText(trace, options),
  encodeTextSync: encodeJaegerTraceText
} as const satisfies WriterWithEncoder<OtlpTrace, never, JaegerTraceWriterOptions>;

/** Encodes one normalized Arrow trace as UTF-8 Jaeger JSON bytes. */
function encodeJaegerTrace(trace: OtlpTrace, options?: JaegerTraceWriterOptions): ArrayBuffer {
  const bytes = new TextEncoder().encode(encodeJaegerTraceText(trace, options));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/** Encodes one normalized Arrow trace as Jaeger JSON text. */
function encodeJaegerTraceText(trace: OtlpTrace, options?: JaegerTraceWriterOptions): string {
  const protobufJson = toJson(ExportTraceServiceRequestSchema, buildOtlpTracesData(trace), {
    enumAsInteger: true,
    alwaysEmitImplicit: true
  });
  const otlpJson = convertProtobufJsonIdsToOtlp(protobufJson) as Record<string, unknown>;
  const traces = convertOtlpJsonToJaeger(otlpJson);
  const output: JaegerQueryResponse | JaegerSpan[] =
    options?.jaegerTrace?.shape === 'spans'
      ? traces.flatMap(traceValue =>
          traceValue.spans.map(span => ({
            ...span,
            process: traceValue.processes?.[span.processID ?? '']
          }))
        )
      : {data: traces, total: traces.length, limit: 0, offset: 0, errors: null};
  return JSON.stringify(output, null, options?.jaegerTrace?.space);
}

/** Converts canonical OTLP protobuf-JSON into Jaeger query traces. */
function convertOtlpJsonToJaeger(value: Record<string, unknown>): JaegerTrace[] {
  const traces = new Map<string, JaegerTrace>();
  const resourceSpans = readArray(value.resourceSpans);

  resourceSpans.forEach((resourceSpanValue, resourceIndex) => {
    const resourceSpan = readRecord(resourceSpanValue);
    const resource = readRecord(resourceSpan.resource);
    const resourceTags = readTags(resource.attributes);
    const serviceNameTag = resourceTags.find(tag => tag.key === 'service.name');
    const processID = `p${resourceIndex + 1}`;
    const process: JaegerProcess = {
      serviceName: serviceNameTag ? String(serviceNameTag.value) : '',
      tags: resourceTags.filter(tag => tag !== serviceNameTag)
    };

    for (const scopeSpanValue of readArray(resourceSpan.scopeSpans)) {
      const scopeSpan = readRecord(scopeSpanValue);
      for (const spanValue of readArray(scopeSpan.spans)) {
        const spanRecord = readRecord(spanValue);
        const span = convertOtlpSpan(spanRecord, processID);
        const trace = traces.get(span.traceID) ?? {
          traceID: span.traceID,
          spans: [],
          processes: {}
        };
        trace.spans.push(span);
        trace.processes![processID] = process;
        traces.set(span.traceID, trace);
      }
    }
  });

  return [...traces.values()];
}

/** Converts one OTLP JSON span into Jaeger JSON. */
function convertOtlpSpan(span: Record<string, unknown>, processID: string): JaegerSpan {
  const traceID = readString(span.traceId).replace(/^0{16}(?=[\da-f]{16}$)/, '');
  const spanID = readString(span.spanId);
  const startTime = nanosecondsToMicroseconds(span.startTimeUnixNano);
  const endTime = nanosecondsToMicroseconds(span.endTimeUnixNano);
  const references: JaegerSpanReference[] = [];
  if (typeof span.parentSpanId === 'string' && span.parentSpanId) {
    references.push({refType: 'CHILD_OF', traceID, spanID: span.parentSpanId});
  }
  for (const linkValue of readArray(span.links)) {
    const link = readRecord(linkValue);
    const attributes = readTags(link.attributes);
    const referenceType = attributes.find(tag => tag.key === 'jaeger.ref_type');
    references.push({
      refType: referenceType ? String(referenceType.value) : 'FOLLOWS_FROM',
      traceID: readString(link.traceId).replace(/^0{16}(?=[\da-f]{16}$)/, ''),
      spanID: readString(link.spanId)
    });
  }

  const tags = readTags(span.attributes);
  appendSpanKindTag(tags, Number(span.kind ?? 0));
  const status = readRecord(span.status);
  if (Number(status.code ?? 0) === 2 && !tags.some(tag => tag.key === 'error')) {
    tags.push({key: 'error', type: 'bool', value: true});
  }

  return {
    traceID,
    spanID,
    operationName: readString(span.name),
    references,
    flags: Number(span.flags ?? 0),
    startTime,
    duration: endTime - startTime,
    tags,
    logs: readArray(span.events).map(eventValue => {
      const event = readRecord(eventValue);
      const fields = readTags(event.attributes);
      if (!fields.some(field => field.key === 'event')) {
        fields.unshift({key: 'event', type: 'string', value: readString(event.name)});
      }
      return {timestamp: nanosecondsToMicroseconds(event.timeUnixNano), fields};
    }),
    processID,
    warnings: null
  };
}

/** Decodes OTLP KeyValue JSON into typed Jaeger tags. */
function readTags(value: unknown): JaegerTag[] {
  return readArray(value).map(item => {
    const keyValue = readRecord(item);
    const anyValue = readRecord(keyValue.value);
    if ('boolValue' in anyValue) {
      return {key: readString(keyValue.key), type: 'bool', value: Boolean(anyValue.boolValue)};
    }
    if ('intValue' in anyValue) {
      return {key: readString(keyValue.key), type: 'int64', value: String(anyValue.intValue)};
    }
    if ('doubleValue' in anyValue) {
      return {key: readString(keyValue.key), type: 'float64', value: Number(anyValue.doubleValue)};
    }
    if ('bytesValue' in anyValue) {
      return {key: readString(keyValue.key), type: 'binary', value: String(anyValue.bytesValue)};
    }
    return {
      key: readString(keyValue.key),
      type: 'string',
      value: String(anyValue.stringValue ?? '')
    };
  });
}

/** Adds a Jaeger span.kind tag when OTLP carries a known kind and no tag exists. */
function appendSpanKindTag(tags: JaegerTag[], kind: number): void {
  const kindName = ['', 'internal', 'server', 'client', 'producer', 'consumer'][kind];
  if (kindName && !tags.some(tag => tag.key === 'span.kind')) {
    tags.push({key: 'span.kind', type: 'string', value: kindName});
  }
}

/** Converts an OTLP nanosecond JSON integer into safe integer microseconds. */
function nanosecondsToMicroseconds(value: unknown): number {
  const microseconds = BigInt(readString(value)) / 1000n;
  const number = Number(microseconds);
  if (!Number.isSafeInteger(number)) {
    throw new Error('Jaeger JSON cannot represent this OTLP timestamp as safe microseconds.');
  }
  return number;
}

/** Reads a JSON array, treating absent repeated fields as empty. */
function readArray(value: unknown): unknown[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error('Expected an array while converting OTLP data to Jaeger JSON.');
  }
  return value;
}

/** Reads one required JSON object. */
function readRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected an object while converting OTLP data to Jaeger JSON.');
  }
  return value as Record<string, unknown>;
}

/** Reads one required JSON string. */
function readString(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Expected a string while converting OTLP data to Jaeger JSON.');
  }
  return value;
}
