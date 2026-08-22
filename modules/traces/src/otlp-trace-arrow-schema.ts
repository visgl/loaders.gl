// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

/** Logical table names in an Arrow-backed OTLP trace. */
export type OtlpTraceTableName = 'resources' | 'scopes' | 'spans' | 'events' | 'links';

/** Arrow columns describing OTLP resources. */
export type OtlpResourceArrowColumns = {
  resource_id: arrow.Uint32;
  schema_url: arrow.Utf8;
  attributes_json: arrow.Utf8;
  dropped_attributes_count: arrow.Uint32;
};

/** Arrow columns describing OTLP instrumentation scopes. */
export type OtlpScopeArrowColumns = {
  scope_id: arrow.Uint32;
  resource_id: arrow.Uint32;
  schema_url: arrow.Utf8;
  name: arrow.Utf8;
  version: arrow.Utf8;
  attributes_json: arrow.Utf8;
  dropped_attributes_count: arrow.Uint32;
};

/** Arrow columns describing OTLP spans. */
export type OtlpSpanArrowColumns = {
  trace_id: arrow.FixedSizeBinary;
  span_id: arrow.FixedSizeBinary;
  parent_span_id: arrow.FixedSizeBinary;
  resource_id: arrow.Uint32;
  scope_id: arrow.Uint32;
  trace_state: arrow.Utf8;
  flags: arrow.Uint32;
  name: arrow.Utf8;
  kind: arrow.Int8;
  start_time_unix_nano: arrow.Uint64;
  end_time_unix_nano: arrow.Uint64;
  attributes_json: arrow.Utf8;
  dropped_attributes_count: arrow.Uint32;
  dropped_events_count: arrow.Uint32;
  dropped_links_count: arrow.Uint32;
  status_code: arrow.Int8;
  status_message: arrow.Utf8;
};

/** Arrow columns describing OTLP span events. */
export type OtlpEventArrowColumns = {
  trace_id: arrow.FixedSizeBinary;
  span_id: arrow.FixedSizeBinary;
  event_index: arrow.Uint32;
  time_unix_nano: arrow.Uint64;
  name: arrow.Utf8;
  attributes_json: arrow.Utf8;
  dropped_attributes_count: arrow.Uint32;
};

/** Arrow columns describing OTLP span links. */
export type OtlpLinkArrowColumns = {
  parent_trace_id: arrow.FixedSizeBinary;
  parent_span_id: arrow.FixedSizeBinary;
  link_index: arrow.Uint32;
  trace_id: arrow.FixedSizeBinary;
  span_id: arrow.FixedSizeBinary;
  trace_state: arrow.Utf8;
  flags: arrow.Uint32;
  attributes_json: arrow.Utf8;
  dropped_attributes_count: arrow.Uint32;
};

/** Typed Arrow table of OTLP resources. */
export type OtlpResourceArrowTable = arrow.Table<OtlpResourceArrowColumns>;
/** Typed Arrow table of OTLP instrumentation scopes. */
export type OtlpScopeArrowTable = arrow.Table<OtlpScopeArrowColumns>;
/** Typed Arrow table of OTLP spans. */
export type OtlpSpanArrowTable = arrow.Table<OtlpSpanArrowColumns>;
/** Typed Arrow table of OTLP span events. */
export type OtlpEventArrowTable = arrow.Table<OtlpEventArrowColumns>;
/** Typed Arrow table of OTLP span links. */
export type OtlpLinkArrowTable = arrow.Table<OtlpLinkArrowColumns>;

/** Arrow-backed OTLP trace returned by the OTLP loaders. */
export type OtlpTrace = {
  resources: OtlpResourceArrowTable;
  scopes: OtlpScopeArrowTable;
  spans: OtlpSpanArrowTable;
  events: OtlpEventArrowTable;
  links: OtlpLinkArrowTable;
};

/** One tagged Arrow record batch emitted by OTLP batched parsing. */
export type OtlpTraceBatch = {
  table: OtlpTraceTableName;
  data: arrow.RecordBatch;
};

/** Arrow schema for OTLP resources. */
export const otlpResourceArrowSchema = new arrow.Schema<OtlpResourceArrowColumns>([
  new arrow.Field('resource_id', new arrow.Uint32(), false),
  new arrow.Field('schema_url', new arrow.Utf8(), true),
  new arrow.Field('attributes_json', new arrow.Utf8(), false),
  new arrow.Field('dropped_attributes_count', new arrow.Uint32(), false)
]);

/** Arrow schema for OTLP instrumentation scopes. */
export const otlpScopeArrowSchema = new arrow.Schema<OtlpScopeArrowColumns>([
  new arrow.Field('scope_id', new arrow.Uint32(), false),
  new arrow.Field('resource_id', new arrow.Uint32(), false),
  new arrow.Field('schema_url', new arrow.Utf8(), true),
  new arrow.Field('name', new arrow.Utf8(), false),
  new arrow.Field('version', new arrow.Utf8(), false),
  new arrow.Field('attributes_json', new arrow.Utf8(), false),
  new arrow.Field('dropped_attributes_count', new arrow.Uint32(), false)
]);

/** Arrow schema for OTLP spans. */
export const otlpSpanArrowSchema = new arrow.Schema<OtlpSpanArrowColumns>([
  new arrow.Field('trace_id', new arrow.FixedSizeBinary(16), false),
  new arrow.Field('span_id', new arrow.FixedSizeBinary(8), false),
  new arrow.Field('parent_span_id', new arrow.FixedSizeBinary(8), true),
  new arrow.Field('resource_id', new arrow.Uint32(), false),
  new arrow.Field('scope_id', new arrow.Uint32(), false),
  new arrow.Field('trace_state', new arrow.Utf8(), false),
  new arrow.Field('flags', new arrow.Uint32(), false),
  new arrow.Field('name', new arrow.Utf8(), false),
  new arrow.Field('kind', new arrow.Int8(), false),
  new arrow.Field('start_time_unix_nano', new arrow.Uint64(), false),
  new arrow.Field('end_time_unix_nano', new arrow.Uint64(), false),
  new arrow.Field('attributes_json', new arrow.Utf8(), false),
  new arrow.Field('dropped_attributes_count', new arrow.Uint32(), false),
  new arrow.Field('dropped_events_count', new arrow.Uint32(), false),
  new arrow.Field('dropped_links_count', new arrow.Uint32(), false),
  new arrow.Field('status_code', new arrow.Int8(), false),
  new arrow.Field('status_message', new arrow.Utf8(), false)
]);

/** Arrow schema for OTLP span events. */
export const otlpEventArrowSchema = new arrow.Schema<OtlpEventArrowColumns>([
  new arrow.Field('trace_id', new arrow.FixedSizeBinary(16), false),
  new arrow.Field('span_id', new arrow.FixedSizeBinary(8), false),
  new arrow.Field('event_index', new arrow.Uint32(), false),
  new arrow.Field('time_unix_nano', new arrow.Uint64(), false),
  new arrow.Field('name', new arrow.Utf8(), false),
  new arrow.Field('attributes_json', new arrow.Utf8(), false),
  new arrow.Field('dropped_attributes_count', new arrow.Uint32(), false)
]);

/** Arrow schema for OTLP span links. */
export const otlpLinkArrowSchema = new arrow.Schema<OtlpLinkArrowColumns>([
  new arrow.Field('parent_trace_id', new arrow.FixedSizeBinary(16), false),
  new arrow.Field('parent_span_id', new arrow.FixedSizeBinary(8), false),
  new arrow.Field('link_index', new arrow.Uint32(), false),
  new arrow.Field('trace_id', new arrow.FixedSizeBinary(16), false),
  new arrow.Field('span_id', new arrow.FixedSizeBinary(8), false),
  new arrow.Field('trace_state', new arrow.Utf8(), false),
  new arrow.Field('flags', new arrow.Uint32(), false),
  new arrow.Field('attributes_json', new arrow.Utf8(), false),
  new arrow.Field('dropped_attributes_count', new arrow.Uint32(), false)
]);
