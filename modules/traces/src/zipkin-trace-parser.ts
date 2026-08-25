// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {OtlpTrace} from './otlp-trace-arrow-schema';
import {parseOtlpTraceJson, type OtlpTraceBuildOffsets} from './otlp-trace-parser';
import type {ZipkinEndpoint, ZipkinSpan} from './zipkin-trace-types';

type OtlpJsonValue = Record<string, unknown>;

/** Parses Zipkin v2 JSON spans into normalized OTLP Arrow tables. */
export function parseZipkinTraceJson(text: string, offsets?: OtlpTraceBuildOffsets): OtlpTrace {
  const spans = parseDocuments(text).flatMap(normalizeDocument);
  const groups = new Map<string, {endpoint: ZipkinEndpoint; spans: ZipkinSpan[]}>();
  for (const span of spans) {
    const endpoint = span.localEndpoint ?? {};
    const key = JSON.stringify(endpoint);
    const group = groups.get(key) ?? {endpoint, spans: []};
    group.spans.push(span);
    groups.set(key, group);
  }
  const resourceSpans = [...groups.values()].map(group => ({
    resource: {attributes: convertEndpoint(group.endpoint, '')},
    scopeSpans: [{scope: {name: 'zipkin'}, spans: group.spans.map(convertZipkinSpan)}]
  }));
  return parseOtlpTraceJson(JSON.stringify({resourceSpans}), offsets);
}

/** Parses one JSON value or one value per line. */
function parseDocuments(text: string): unknown[] {
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

/** Normalizes a Zipkin span, span array, or list of traces. */
function normalizeDocument(value: unknown): ZipkinSpan[] {
  if (isZipkinSpan(value)) {
    return [value];
  }
  if (Array.isArray(value)) {
    const flattened = value.flatMap(item => (Array.isArray(item) ? item : [item]));
    if (flattened.every(isZipkinSpan)) {
      return flattened;
    }
  }
  throw new Error('Zipkin JSON must contain a span, span array, or array of traces.');
}

/** Converts one Zipkin span into OTLP protobuf-JSON. */
function convertZipkinSpan(span: ZipkinSpan): OtlpJsonValue {
  const startTime = microsecondsToNanoseconds(span.timestamp ?? 0);
  const duration = microsecondsToNanoseconds(span.duration ?? 0);
  const attributes = [
    ...Object.entries(span.tags ?? {}).map(([key, value]) => ({
      key,
      value: {stringValue: value}
    })),
    ...convertEndpoint(span.remoteEndpoint ?? {}, 'zipkin.remote.'),
    ...(span.debug === undefined ? [] : [{key: 'zipkin.debug', value: {boolValue: span.debug}}]),
    ...(span.shared === undefined ? [] : [{key: 'zipkin.shared', value: {boolValue: span.shared}}])
  ];
  return {
    traceId: normalizeHexID(span.traceId, 32, 'traceId'),
    spanId: normalizeHexID(span.id, 16, 'id'),
    ...(span.parentId && {parentSpanId: normalizeHexID(span.parentId, 16, 'parentId')}),
    name: span.name ?? '',
    kind: {SERVER: 2, CLIENT: 3, PRODUCER: 4, CONSUMER: 5}[span.kind ?? ''] ?? 0,
    startTimeUnixNano: startTime.toString(),
    endTimeUnixNano: (startTime + duration).toString(),
    attributes,
    events: (span.annotations ?? []).map(annotation => ({
      timeUnixNano: microsecondsToNanoseconds(annotation.timestamp).toString(),
      name: annotation.value
    })),
    status: {code: span.tags?.error ? 2 : 0}
  };
}

/** Converts endpoint fields into OTLP resource or span attributes. */
function convertEndpoint(endpoint: ZipkinEndpoint, prefix: string): OtlpJsonValue[] {
  const attributes: OtlpJsonValue[] = [];
  const names = prefix
    ? {serviceName: `${prefix}service_name`, ipv4: `${prefix}ipv4`, ipv6: `${prefix}ipv6`}
    : {serviceName: 'service.name', ipv4: 'server.address', ipv6: 'server.address'};
  for (const field of ['serviceName', 'ipv4', 'ipv6'] as const) {
    if (endpoint[field] !== undefined) {
      attributes.push({key: names[field], value: {stringValue: endpoint[field]}});
    }
  }
  if (endpoint.port !== undefined) {
    attributes.push({
      key: prefix ? `${prefix}port` : 'server.port',
      value: {intValue: String(endpoint.port)}
    });
  }
  return attributes;
}

/** Converts Zipkin integer microseconds to nanoseconds. */
function microsecondsToNanoseconds(value: number | string): bigint {
  if (typeof value === 'number' && (!Number.isSafeInteger(value) || value < 0)) {
    throw new Error('Zipkin timestamps and durations must be non-negative safe integers.');
  }
  if (typeof value === 'string' && !/^\d+$/.test(value)) {
    throw new Error('Zipkin timestamp and duration strings must be unsigned integers.');
  }
  return BigInt(value) * 1000n;
}

/** Validates and pads one Zipkin hexadecimal identifier. */
function normalizeHexID(value: string, length: number, fieldName: string): string {
  if (!/^[\da-f]+$/i.test(value) || value.length > length) {
    throw new Error(`Zipkin ${fieldName} must be at most ${length} hexadecimal characters.`);
  }
  return value.toLowerCase().padStart(length, '0');
}

/** Checks whether a value resembles one Zipkin v2 span. */
function isZipkinSpan(value: unknown): value is ZipkinSpan {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof (value as ZipkinSpan).traceId === 'string' &&
    typeof (value as ZipkinSpan).id === 'string'
  );
}
