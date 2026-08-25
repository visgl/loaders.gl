// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fromBinary, fromJson, toJson, type JsonValue} from '@bufbuild/protobuf';
import * as arrow from 'apache-arrow';

import {ExportTraceServiceRequestSchema} from './otlp-proto/generated/opentelemetry/proto/collector/trace/v1/trace_service_pb';
import {
  KeyValueSchema,
  type KeyValue
} from './otlp-proto/generated/opentelemetry/proto/common/v1/common_pb';
import type {
  ResourceSpans,
  ScopeSpans,
  Span
} from './otlp-proto/generated/opentelemetry/proto/trace/v1/trace_pb';
import {
  otlpEventArrowSchema,
  otlpLinkArrowSchema,
  otlpResourceArrowSchema,
  otlpScopeArrowSchema,
  otlpSpanArrowSchema,
  type OtlpTrace
} from './otlp-trace-arrow-schema';
import {convertOtlpJsonIdsToProtobuf} from './otlp-json';

type OtlpRow = Record<string, unknown>;

/** Starting identifiers used when appending independently parsed OTLP documents. */
export type OtlpTraceBuildOffsets = {
  resourceId?: number;
  scopeId?: number;
};

/** Parses one binary OTLP TracesData or ExportTraceServiceRequest payload. */
export function parseOtlpTraceProtobuf(bytes: Uint8Array): OtlpTrace {
  return buildOtlpTrace(fromBinary(ExportTraceServiceRequestSchema, bytes));
}

/** Parses one OTLP protobuf-JSON payload or JSON Lines trace file. */
export function parseOtlpTraceJson(text: string, offsets?: OtlpTraceBuildOffsets): OtlpTrace {
  const trimmedText = text.trim();
  const jsonValues =
    tryParseJson(trimmedText) ??
    trimmedText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => JSON.parse(line));
  const documents = jsonValues.map(value =>
    fromJson(ExportTraceServiceRequestSchema, convertOtlpJsonIdsToProtobuf(value) as JsonValue, {
      ignoreUnknownFields: true
    })
  );
  return buildOtlpTrace(
    {resourceSpans: documents.flatMap(document => document.resourceSpans)},
    offsets
  );
}

/** Parses one complete JSON document, falling back to JSON Lines when incomplete. */
function tryParseJson(text: string): unknown[] | null {
  try {
    return [JSON.parse(text)];
  } catch {
    return null;
  }
}

/** Converts one canonical OTLP message into normalized Arrow tables. */
export function buildOtlpTrace(
  tracesData: {resourceSpans: ResourceSpans[]},
  offsets: OtlpTraceBuildOffsets = {}
): OtlpTrace {
  const resourceRows: OtlpRow[] = [];
  const scopeRows: OtlpRow[] = [];
  const spanRows: OtlpRow[] = [];
  const eventRows: OtlpRow[] = [];
  const linkRows: OtlpRow[] = [];

  tracesData.resourceSpans.forEach((resourceSpans, resourceIndex) => {
    const resourceId = (offsets.resourceId ?? 0) + resourceIndex;
    appendResourceRow(resourceRows, resourceSpans, resourceId);
    resourceSpans.scopeSpans.forEach(scopeSpans => {
      const scopeId = (offsets.scopeId ?? 0) + scopeRows.length;
      appendScopeRow(scopeRows, scopeSpans, resourceId, scopeId);
      for (const span of scopeSpans.spans) {
        appendSpanRows(spanRows, eventRows, linkRows, span, resourceId, scopeId);
      }
    });
  });

  return {
    resources: buildArrowTable(otlpResourceArrowSchema, resourceRows) as OtlpTrace['resources'],
    scopes: buildArrowTable(otlpScopeArrowSchema, scopeRows) as OtlpTrace['scopes'],
    spans: buildArrowTable(otlpSpanArrowSchema, spanRows) as OtlpTrace['spans'],
    events: buildArrowTable(otlpEventArrowSchema, eventRows) as OtlpTrace['events'],
    links: buildArrowTable(otlpLinkArrowSchema, linkRows) as OtlpTrace['links']
  };
}

/** Appends one normalized resource row. */
function appendResourceRow(
  rows: OtlpRow[],
  resourceSpans: ResourceSpans,
  resourceId: number
): void {
  rows.push({
    resource_id: resourceId,
    schema_url: resourceSpans.schemaUrl || null,
    attributes_json: serializeAttributes(resourceSpans.resource?.attributes ?? []),
    dropped_attributes_count: resourceSpans.resource?.droppedAttributesCount ?? 0
  });
}

/** Appends one normalized instrumentation scope row. */
function appendScopeRow(
  rows: OtlpRow[],
  scopeSpans: ScopeSpans,
  resourceId: number,
  scopeId: number
): void {
  rows.push({
    scope_id: scopeId,
    resource_id: resourceId,
    schema_url: scopeSpans.schemaUrl || null,
    name: scopeSpans.scope?.name ?? '',
    version: scopeSpans.scope?.version ?? '',
    attributes_json: serializeAttributes(scopeSpans.scope?.attributes ?? []),
    dropped_attributes_count: scopeSpans.scope?.droppedAttributesCount ?? 0
  });
}

/** Appends one span and its child event and link rows. */
function appendSpanRows(
  spanRows: OtlpRow[],
  eventRows: OtlpRow[],
  linkRows: OtlpRow[],
  span: Span,
  resourceId: number,
  scopeId: number
): void {
  spanRows.push({
    trace_id: span.traceId,
    span_id: span.spanId,
    parent_span_id: span.parentSpanId.byteLength === 0 ? null : span.parentSpanId,
    resource_id: resourceId,
    scope_id: scopeId,
    trace_state: span.traceState,
    flags: span.flags,
    name: span.name,
    kind: span.kind,
    start_time_unix_nano: span.startTimeUnixNano,
    end_time_unix_nano: span.endTimeUnixNano,
    attributes_json: serializeAttributes(span.attributes),
    dropped_attributes_count: span.droppedAttributesCount,
    dropped_events_count: span.droppedEventsCount,
    dropped_links_count: span.droppedLinksCount,
    status_code: span.status?.code ?? 0,
    status_message: span.status?.message ?? ''
  });

  span.events.forEach((event, eventIndex) => {
    eventRows.push({
      trace_id: span.traceId,
      span_id: span.spanId,
      event_index: eventIndex,
      time_unix_nano: event.timeUnixNano,
      name: event.name,
      attributes_json: serializeAttributes(event.attributes),
      dropped_attributes_count: event.droppedAttributesCount
    });
  });

  span.links.forEach((link, linkIndex) => {
    linkRows.push({
      parent_trace_id: span.traceId,
      parent_span_id: span.spanId,
      link_index: linkIndex,
      trace_id: link.traceId,
      span_id: link.spanId,
      trace_state: link.traceState,
      flags: link.flags,
      attributes_json: serializeAttributes(link.attributes),
      dropped_attributes_count: link.droppedAttributesCount
    });
  });
}

/** Serializes OTLP KeyValue messages with protobuf-JSON type fidelity. */
function serializeAttributes(attributes: readonly KeyValue[]): string {
  return JSON.stringify(
    attributes.map(attribute => toJson(KeyValueSchema, attribute, {alwaysEmitImplicit: true}))
  );
}

/** Builds one schema-constrained Arrow table from normalized row objects. */
function buildArrowTable(schema: arrow.Schema, rows: readonly OtlpRow[]): arrow.Table {
  if (rows.length === 0) {
    return new arrow.Table(schema);
  }
  const columns: Record<string, arrow.Vector> = {};
  for (const field of schema.fields) {
    columns[field.name] = arrow.vectorFromArray(
      rows.map(row => row[field.name] ?? null),
      field.type
    );
  }
  return new arrow.Table(schema, columns);
}
