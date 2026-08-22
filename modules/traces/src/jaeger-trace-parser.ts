// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {OtlpTrace} from './otlp-trace-arrow-schema';
import {parseOtlpTraceJson, type OtlpTraceBuildOffsets} from './otlp-trace-parser';
import type {
  JaegerLog,
  JaegerProcess,
  JaegerQueryResponse,
  JaegerSpan,
  JaegerSpanReference,
  JaegerTag,
  JaegerTrace
} from './jaeger-trace-types';

type OtlpJsonValue = Record<string, unknown>;

/** Parses supported Jaeger JSON shapes into normalized OTLP Arrow tables. */
export function parseJaegerTraceJson(text: string, offsets?: OtlpTraceBuildOffsets): OtlpTrace {
  const values = parseJsonDocuments(text);
  const resourceSpans = values.flatMap(value =>
    normalizeJaegerDocument(value).flatMap(convertJaegerTrace)
  );
  return parseOtlpTraceJson(JSON.stringify({resourceSpans}), offsets);
}

/** Parses one JSON document or newline-delimited Jaeger documents. */
function parseJsonDocuments(text: string): unknown[] {
  const trimmedText = text.trim();
  try {
    return [JSON.parse(trimmedText)];
  } catch {
    return trimmedText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => JSON.parse(line));
  }
}

/** Normalizes the Jaeger Query API, trace-object, and raw span-array shapes. */
function normalizeJaegerDocument(value: unknown): JaegerTrace[] {
  if (Array.isArray(value)) {
    if (value.every(isJaegerSpan)) {
      return groupEmbeddedSpans(value);
    }
    if (value.every(isJaegerTrace)) {
      return value;
    }
  }
  if (isRecord(value) && Array.isArray(value.data)) {
    return (value as JaegerQueryResponse).data;
  }
  if (isJaegerTrace(value)) {
    return [value];
  }
  throw new Error('Jaeger JSON must contain a query response, trace object, or span array.');
}

/** Groups embedded-process spans into logical traces. */
function groupEmbeddedSpans(spans: JaegerSpan[]): JaegerTrace[] {
  const traces = new Map<string, JaegerSpan[]>();
  for (const span of spans) {
    const traceSpans = traces.get(span.traceID) ?? [];
    traceSpans.push(span);
    traces.set(span.traceID, traceSpans);
  }
  return [...traces].map(([traceID, traceSpans]) => ({traceID, spans: traceSpans}));
}

/** Converts one Jaeger trace into OTLP ResourceSpans groups. */
function convertJaegerTrace(trace: JaegerTrace): OtlpJsonValue[] {
  const groups = new Map<
    string,
    {process: JaegerProcess; processID: string; spans: JaegerSpan[]}
  >();
  trace.spans.forEach((span, spanIndex) => {
    const processID = span.processID ?? `embedded-${spanIndex}`;
    const process = span.process ?? trace.processes?.[processID] ?? {serviceName: ''};
    const groupKey = span.processID ? `id:${processID}` : `value:${JSON.stringify(process)}`;
    const group = groups.get(groupKey) ?? {process, processID, spans: []};
    group.spans.push(span);
    groups.set(groupKey, group);
  });

  return [...groups.values()].map(group => ({
    resource: {
      attributes: [
        {key: 'service.name', value: {stringValue: group.process.serviceName}},
        ...(group.process.tags ?? []).map(convertJaegerTag)
      ]
    },
    scopeSpans: [
      {
        scope: {name: 'jaeger'},
        spans: group.spans.map(span => convertJaegerSpan(span, trace.traceID))
      }
    ]
  }));
}

/** Converts one Jaeger span into OTLP protobuf-JSON. */
function convertJaegerSpan(span: JaegerSpan, fallbackTraceID: string): OtlpJsonValue {
  const traceID = normalizeHexID(span.traceID || fallbackTraceID, 32, 'traceID');
  const references = span.references ?? [];
  const parent = references.find(
    reference =>
      reference.refType === 'CHILD_OF' &&
      normalizeHexID(reference.traceID, 32, 'reference traceID') === traceID
  );
  const links = references.filter(reference => reference !== parent).map(convertJaegerReference);
  const startTimeUnixNano = microsecondsToNanoseconds(span.startTime);
  const attributes = (span.tags ?? []).map(convertJaegerTag);

  return {
    traceId: traceID,
    spanId: normalizeHexID(span.spanID, 16, 'spanID'),
    ...(parent && {parentSpanId: normalizeHexID(parent.spanID, 16, 'parent spanID')}),
    flags: span.flags ?? 0,
    name: span.operationName,
    kind: readSpanKind(span.tags),
    startTimeUnixNano: startTimeUnixNano.toString(),
    endTimeUnixNano: (startTimeUnixNano + microsecondsToNanoseconds(span.duration)).toString(),
    attributes,
    events: (span.logs ?? []).map(convertJaegerLog),
    links,
    status: {code: hasErrorTag(span.tags) ? 2 : 0}
  };
}

/** Converts one Jaeger reference into an OTLP link. */
function convertJaegerReference(reference: JaegerSpanReference): OtlpJsonValue {
  return {
    traceId: normalizeHexID(reference.traceID, 32, 'reference traceID'),
    spanId: normalizeHexID(reference.spanID, 16, 'reference spanID'),
    attributes: [{key: 'jaeger.ref_type', value: {stringValue: reference.refType}}]
  };
}

/** Converts one Jaeger log into an OTLP span event. */
function convertJaegerLog(log: JaegerLog): OtlpJsonValue {
  const eventField = log.fields.find(field => field.key === 'event');
  return {
    timeUnixNano: microsecondsToNanoseconds(log.timestamp).toString(),
    name: eventField ? String(eventField.value) : 'log',
    attributes: log.fields.map(convertJaegerTag)
  };
}

/** Converts one typed Jaeger tag into an OTLP KeyValue. */
function convertJaegerTag(tag: JaegerTag): OtlpJsonValue {
  let value: OtlpJsonValue;
  switch (tag.type) {
    case 'bool':
      value = {boolValue: tag.value === true || tag.value === 'true'};
      break;
    case 'int64':
      value = {intValue: String(tag.value)};
      break;
    case 'float64':
      value = {doubleValue: Number(tag.value)};
      break;
    case 'binary':
      value = {bytesValue: String(tag.value)};
      break;
    default:
      value = {stringValue: String(tag.value)};
  }
  return {key: tag.key, value};
}

/** Maps the Jaeger span.kind tag onto the OTLP span-kind enum. */
function readSpanKind(tags: JaegerTag[] | undefined): number {
  const value = tags?.find(tag => tag.key === 'span.kind')?.value;
  return {internal: 1, server: 2, client: 3, producer: 4, consumer: 5}[String(value)] ?? 0;
}

/** Returns whether a Jaeger span carries a truthy error tag. */
function hasErrorTag(tags: JaegerTag[] | undefined): boolean {
  const value = tags?.find(tag => tag.key === 'error')?.value;
  return value === true || value === 'true';
}

/** Converts integer microseconds to nanoseconds without floating-point multiplication. */
function microsecondsToNanoseconds(value: number): bigint {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('Jaeger timestamps and durations must be non-negative safe integers.');
  }
  return BigInt(value) * 1000n;
}

/** Validates and pads a Jaeger hexadecimal identifier. */
function normalizeHexID(value: string, length: number, fieldName: string): string {
  if (!/^[\da-f]+$/i.test(value) || value.length > length) {
    throw new Error(`Jaeger ${fieldName} must be at most ${length} hexadecimal characters.`);
  }
  return value.toLowerCase().padStart(length, '0');
}

/** Checks whether a value resembles one Jaeger span. */
function isJaegerSpan(value: unknown): value is JaegerSpan {
  return isRecord(value) && typeof value.traceID === 'string' && typeof value.spanID === 'string';
}

/** Checks whether a value resembles one Jaeger trace. */
function isJaegerTrace(value: unknown): value is JaegerTrace {
  return isRecord(value) && typeof value.traceID === 'string' && Array.isArray(value.spans);
}

/** Checks whether a value is a non-null JSON object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
