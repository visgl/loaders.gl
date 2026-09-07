// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

/**
 * Arrow column map for raw Chrome trace events.
 */
export type ChromeTraceEventArrowColumns = {
  /** Event name from the source row. */
  name: arrow.Utf8;
  /** Chrome trace phase discriminator. */
  ph: arrow.Utf8;
  /** Raw timestamp in the source file's declared time unit. */
  ts: arrow.Float64;
  /** Process identifier normalized to a string. */
  pid: arrow.Utf8;
  /** Thread identifier normalized to a string. */
  tid: arrow.Utf8;
  /** Optional category label. */
  cat: arrow.Utf8;
  /** Optional duration value. */
  dur: arrow.Float64;
  /** Optional thread-local duration. */
  tdur: arrow.Float64;
  /** Optional thread-local timestamp. */
  tts: arrow.Float64;
  /** Optional async or flow identifier normalized to a string. */
  id: arrow.Utf8;
  /** Optional bind identifier normalized to a string. */
  bind_id: arrow.Utf8;
  /** Optional normalized scope string. */
  scope: arrow.Utf8;
  /** Optional JSON-encoded args payload. */
  args: arrow.Utf8;
  /** Optional JSON-encoded passthrough payload. */
  extraJson: arrow.Utf8;
};

/**
 * Typed Arrow schema for raw Chrome trace events.
 */
export type ChromeTraceEventArrowSchema = arrow.Schema<ChromeTraceEventArrowColumns>;

/**
 * Typed Arrow table for raw Chrome trace events.
 */
export type ChromeTraceEventArrowTable = arrow.Table<ChromeTraceEventArrowColumns>;

/**
 * Typed Arrow record batch for raw Chrome trace events.
 */
export type ChromeTraceEventArrowRecordBatch = arrow.RecordBatch<ChromeTraceEventArrowColumns>;

/**
 * Ordered Arrow fields for the Chrome trace event schema.
 */
export const CHROME_TRACE_EVENT_ARROW_FIELDS = [
  new arrow.Field('name', new arrow.Utf8(), false),
  new arrow.Field('ph', new arrow.Utf8(), false),
  new arrow.Field('ts', new arrow.Float64(), true),
  new arrow.Field('pid', new arrow.Utf8(), true),
  new arrow.Field('tid', new arrow.Utf8(), true),
  new arrow.Field('cat', new arrow.Utf8(), true),
  new arrow.Field('dur', new arrow.Float64(), true),
  new arrow.Field('tdur', new arrow.Float64(), true),
  new arrow.Field('tts', new arrow.Float64(), true),
  new arrow.Field('id', new arrow.Utf8(), true),
  new arrow.Field('bind_id', new arrow.Utf8(), true),
  new arrow.Field('scope', new arrow.Utf8(), true),
  new arrow.Field('args', new arrow.Utf8(), true),
  new arrow.Field('extraJson', new arrow.Utf8(), true)
] as const;

/**
 * Arrow schema for raw Chrome trace events without per-file metadata attached.
 */
export const chromeTraceEventArrowSchema = new arrow.Schema<ChromeTraceEventArrowColumns>([
  ...CHROME_TRACE_EVENT_ARROW_FIELDS
]);
