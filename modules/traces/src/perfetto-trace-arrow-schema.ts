// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

/** Supported logical tables in a decoded Perfetto trace. */
export type PerfettoTraceTableName = 'tracks' | 'slices' | 'processes' | 'threads';

/** Arrow columns describing Perfetto tracks. */
export type PerfettoTrackArrowColumns = {
  track_uuid: arrow.Uint64;
  parent_track_uuid: arrow.Uint64;
  type: arrow.Utf8;
  name: arrow.Utf8;
  pid: arrow.Int32;
  tid: arrow.Int32;
};

/** Arrow columns describing completed Perfetto slices and instants. */
export type PerfettoSliceArrowColumns = {
  track_uuid: arrow.Uint64;
  ts: arrow.Uint64;
  dur: arrow.Uint64;
  name: arrow.Utf8;
};

/** Arrow columns describing Perfetto processes. */
export type PerfettoProcessArrowColumns = {
  pid: arrow.Int32;
  name: arrow.Utf8;
};

/** Arrow columns describing Perfetto threads. */
export type PerfettoThreadArrowColumns = {
  tid: arrow.Int32;
  pid: arrow.Int32;
  name: arrow.Utf8;
};

/** Typed Arrow table of Perfetto tracks. */
export type PerfettoTrackArrowTable = arrow.Table<PerfettoTrackArrowColumns>;
/** Typed Arrow table of Perfetto slices. */
export type PerfettoSliceArrowTable = arrow.Table<PerfettoSliceArrowColumns>;
/** Typed Arrow table of Perfetto processes. */
export type PerfettoProcessArrowTable = arrow.Table<PerfettoProcessArrowColumns>;
/** Typed Arrow table of Perfetto threads. */
export type PerfettoThreadArrowTable = arrow.Table<PerfettoThreadArrowColumns>;

/** Arrow-backed result returned by the Perfetto trace loader. */
export type PerfettoTrace = {
  tracks: PerfettoTrackArrowTable;
  slices: PerfettoSliceArrowTable;
  processes: PerfettoProcessArrowTable;
  threads: PerfettoThreadArrowTable;
};

/** One tagged Arrow record batch emitted by batched Perfetto parsing. */
export type PerfettoTraceBatch = {
  table: PerfettoTraceTableName;
  data: arrow.RecordBatch;
};

/** Arrow schema for Perfetto tracks. */
export const perfettoTrackArrowSchema = new arrow.Schema<PerfettoTrackArrowColumns>([
  new arrow.Field('track_uuid', new arrow.Uint64(), false),
  new arrow.Field('parent_track_uuid', new arrow.Uint64(), true),
  new arrow.Field('type', new arrow.Utf8(), false),
  new arrow.Field('name', new arrow.Utf8(), true),
  new arrow.Field('pid', new arrow.Int32(), true),
  new arrow.Field('tid', new arrow.Int32(), true)
]);

/** Arrow schema for Perfetto slices. */
export const perfettoSliceArrowSchema = new arrow.Schema<PerfettoSliceArrowColumns>([
  new arrow.Field('track_uuid', new arrow.Uint64(), false),
  new arrow.Field('ts', new arrow.Uint64(), false),
  new arrow.Field('dur', new arrow.Uint64(), false),
  new arrow.Field('name', new arrow.Utf8(), false)
]);

/** Arrow schema for Perfetto processes. */
export const perfettoProcessArrowSchema = new arrow.Schema<PerfettoProcessArrowColumns>([
  new arrow.Field('pid', new arrow.Int32(), false),
  new arrow.Field('name', new arrow.Utf8(), true)
]);

/** Arrow schema for Perfetto threads. */
export const perfettoThreadArrowSchema = new arrow.Schema<PerfettoThreadArrowColumns>([
  new arrow.Field('tid', new arrow.Int32(), false),
  new arrow.Field('pid', new arrow.Int32(), true),
  new arrow.Field('name', new arrow.Utf8(), true)
]);
