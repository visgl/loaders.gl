// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {create, fromJson} from '@bufbuild/protobuf';

import {
  ExportTraceServiceRequestSchema,
  type ExportTraceServiceRequest
} from './otlp-proto/generated/opentelemetry/proto/collector/trace/v1/trace_service_pb';
import {
  InstrumentationScopeSchema,
  KeyValueSchema,
  type KeyValue
} from './otlp-proto/generated/opentelemetry/proto/common/v1/common_pb';
import {ResourceSchema} from './otlp-proto/generated/opentelemetry/proto/resource/v1/resource_pb';
import {
  ResourceSpansSchema,
  ScopeSpansSchema,
  Span_EventSchema,
  Span_LinkSchema,
  SpanSchema,
  StatusSchema,
  type ResourceSpans,
  type ScopeSpans,
  type Span
} from './otlp-proto/generated/opentelemetry/proto/trace/v1/trace_pb';
import type {OtlpTrace} from './otlp-trace-arrow-schema';

/** Reconstructs one canonical OTLP message from normalized Arrow tables. */
export function buildOtlpTracesData(trace: OtlpTrace): ExportTraceServiceRequest {
  const resourceSpansById = new Map<number, ResourceSpans>();
  const scopeSpansById = new Map<number, ScopeSpans>();
  const spansByKey = new Map<string, Span>();

  for (const row of readRows(trace.resources)) {
    const resourceId = readNumber(row.resource_id);
    const resourceSpans = create(ResourceSpansSchema, {
      resource: create(ResourceSchema, {
        attributes: parseAttributes(row.attributes_json),
        droppedAttributesCount: readNumber(row.dropped_attributes_count)
      }),
      scopeSpans: [],
      schemaUrl: readOptionalString(row.schema_url) ?? ''
    });
    resourceSpansById.set(resourceId, resourceSpans);
  }

  for (const row of readRows(trace.scopes)) {
    const scopeId = readNumber(row.scope_id);
    const resourceSpans = getRequiredMapValue(
      resourceSpansById,
      readNumber(row.resource_id),
      'resource_id'
    );
    const scopeSpans = create(ScopeSpansSchema, {
      scope: create(InstrumentationScopeSchema, {
        name: readString(row.name),
        version: readString(row.version),
        attributes: parseAttributes(row.attributes_json),
        droppedAttributesCount: readNumber(row.dropped_attributes_count)
      }),
      spans: [],
      schemaUrl: readOptionalString(row.schema_url) ?? ''
    });
    resourceSpans.scopeSpans.push(scopeSpans);
    scopeSpansById.set(scopeId, scopeSpans);
  }

  for (const row of readRows(trace.spans)) {
    const traceId = readBytes(row.trace_id, 16);
    const spanId = readBytes(row.span_id, 8);
    const span = create(SpanSchema, {
      traceId,
      spanId,
      parentSpanId: readOptionalBytes(row.parent_span_id, 8) ?? new Uint8Array(),
      traceState: readString(row.trace_state),
      flags: readNumber(row.flags),
      name: readString(row.name),
      kind: readNumber(row.kind),
      startTimeUnixNano: readBigInt(row.start_time_unix_nano),
      endTimeUnixNano: readBigInt(row.end_time_unix_nano),
      attributes: parseAttributes(row.attributes_json),
      droppedAttributesCount: readNumber(row.dropped_attributes_count),
      events: [],
      droppedEventsCount: readNumber(row.dropped_events_count),
      links: [],
      droppedLinksCount: readNumber(row.dropped_links_count),
      status: create(StatusSchema, {
        code: readNumber(row.status_code),
        message: readString(row.status_message)
      })
    });
    getRequiredMapValue(scopeSpansById, readNumber(row.scope_id), 'scope_id').spans.push(span);
    spansByKey.set(buildSpanKey(traceId, spanId), span);
  }

  for (const row of sortRowsByIndex(readRows(trace.events), 'event_index')) {
    const span = getRequiredSpan(spansByKey, row.trace_id, row.span_id);
    span.events.push(
      create(Span_EventSchema, {
        timeUnixNano: readBigInt(row.time_unix_nano),
        name: readString(row.name),
        attributes: parseAttributes(row.attributes_json),
        droppedAttributesCount: readNumber(row.dropped_attributes_count)
      })
    );
  }

  for (const row of sortRowsByIndex(readRows(trace.links), 'link_index')) {
    const span = getRequiredSpan(spansByKey, row.parent_trace_id, row.parent_span_id);
    span.links.push(
      create(Span_LinkSchema, {
        traceId: readBytes(row.trace_id, 16),
        spanId: readBytes(row.span_id, 8),
        traceState: readString(row.trace_state),
        flags: readNumber(row.flags),
        attributes: parseAttributes(row.attributes_json),
        droppedAttributesCount: readNumber(row.dropped_attributes_count)
      })
    );
  }

  return create(ExportTraceServiceRequestSchema, {
    resourceSpans: [...resourceSpansById.values()]
  });
}

/** Materializes rows from one Arrow table. */
function readRows(table: OtlpTrace[keyof OtlpTrace]): Record<string, unknown>[] {
  return Array.from(table as Iterable<Record<string, unknown>>);
}

/** Parses one protobuf-JSON KeyValue array stored in Arrow. */
function parseAttributes(value: unknown): KeyValue[] {
  const parsed = JSON.parse(readString(value)) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('OTLP attributes_json columns must contain JSON arrays.');
  }
  return parsed.map(item => fromJson(KeyValueSchema, item));
}

/** Sorts child rows by their stable per-span index. */
function sortRowsByIndex(
  rows: Record<string, unknown>[],
  key: 'event_index' | 'link_index'
): Record<string, unknown>[] {
  return rows.sort((left, right) => readNumber(left[key]) - readNumber(right[key]));
}

/** Finds the parent span for one event or link row. */
function getRequiredSpan(
  spans: ReadonlyMap<string, Span>,
  traceIdValue: unknown,
  spanIdValue: unknown
): Span {
  const traceId = readBytes(traceIdValue, 16);
  const spanId = readBytes(spanIdValue, 8);
  return getRequiredMapValue(spans, buildSpanKey(traceId, spanId), 'trace_id/span_id');
}

/** Builds a collision-free parent lookup key from binary OTLP IDs. */
function buildSpanKey(traceId: Uint8Array, spanId: Uint8Array): string {
  return `${toHex(traceId)}:${toHex(spanId)}`;
}

/** Converts bytes to lowercase hexadecimal without relying on Node APIs. */
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Reads one required finite number. */
function readNumber(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('OTLP Arrow data is missing a required numeric value.');
  }
  return value;
}

/** Reads one required bigint-compatible value. */
function readBigInt(value: unknown): bigint {
  if (typeof value !== 'bigint') {
    throw new Error('OTLP Arrow data is missing a required uint64 value.');
  }
  return value;
}

/** Reads one required string. */
function readString(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('OTLP Arrow data is missing a required string value.');
  }
  return value;
}

/** Reads one optional string. */
function readOptionalString(value: unknown): string | undefined {
  return value == null ? undefined : readString(value);
}

/** Reads one required fixed-size binary value. */
function readBytes(value: unknown, byteLength: number): Uint8Array {
  if (!(value instanceof Uint8Array) || value.byteLength !== byteLength) {
    throw new Error(`OTLP Arrow data requires a ${byteLength}-byte identifier.`);
  }
  return value;
}

/** Reads one optional fixed-size binary value. */
function readOptionalBytes(value: unknown, byteLength: number): Uint8Array | undefined {
  return value == null ? undefined : readBytes(value, byteLength);
}

/** Reads one required value from a lookup map. */
function getRequiredMapValue<Key, Value>(
  map: ReadonlyMap<Key, Value>,
  key: Key,
  fieldName: string
): Value {
  const value = map.get(key);
  if (!value) {
    throw new Error(`OTLP Arrow data references an unknown ${fieldName}.`);
  }
  return value;
}
