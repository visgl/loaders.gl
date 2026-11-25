// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GeoJSONTable, ObjectRowTable, Schema} from '@loaders.gl/core/schema';

/** A GTFS Schedule row with source column names and derived `*_seconds` columns. */
export type GTFSRow = Record<string, string | number | null>;

/** One CSV table with a schema derived from the header and the GTFS field types. */
export type GTFSTable = ObjectRowTable & {
  /** Schedule records keyed by column name. */
  data: GTFSRow[];
  /** Fields in header order, followed by derived columns. */
  schema: Schema;
};

/** Counts of GTFS Schedule CSV records whose field count differs from the header. */
export type GTFSFileWarnings = {
  /** Rows with missing fields, padded with empty values. */
  shortRows: number;
  /** Rows with extra fields, truncated to the header length. */
  longRows: number;
};

/** GTFS Schedule tables, parse warnings, and the two geometry layers derived from the tables. */
export type GTFSData = {
  /** CSV tables by root file name without the .txt suffix. */
  tables: Partial<Record<string, GTFSTable>>;
  /** Row-length warnings keyed by file name without .txt. Clean files are omitted. */
  warnings: Partial<Record<string, GTFSFileWarnings>>;
  /** Point features from stops with coordinates. */
  stops: GeoJSONTable;
  /** LineString features from shapes with at least two valid points. */
  shapes: GeoJSONTable;
};

/** GTFS Schedule field types that require conversion beyond UTF-8 strings. */
export type GTFSColumnType = 'integer' | 'float' | 'time';

/** Numeric and time columns of typed Schedule tables. Unlisted columns remain strings. */
export const GTFS_COLUMN_TYPES: Readonly<
  Partial<Record<string, Readonly<Partial<Record<string, GTFSColumnType>>>>>
> = {
  agency: {cemv_support: 'integer'},
  stops: {
    stop_lat: 'float',
    stop_lon: 'float',
    location_type: 'integer',
    wheelchair_boarding: 'integer',
    stop_access: 'integer'
  },
  routes: {
    route_type: 'integer',
    route_sort_order: 'integer',
    continuous_pickup: 'integer',
    continuous_drop_off: 'integer',
    cemv_support: 'integer'
  },
  trips: {
    direction_id: 'integer',
    wheelchair_accessible: 'integer',
    bikes_allowed: 'integer',
    cars_allowed: 'integer',
    safe_duration_factor: 'float',
    safe_duration_offset: 'float'
  },
  stop_times: {
    arrival_time: 'time',
    departure_time: 'time',
    stop_sequence: 'integer',
    start_pickup_drop_off_window: 'time',
    end_pickup_drop_off_window: 'time',
    pickup_type: 'integer',
    drop_off_type: 'integer',
    continuous_pickup: 'integer',
    continuous_drop_off: 'integer',
    shape_dist_traveled: 'float',
    timepoint: 'integer'
  },
  calendar: {
    monday: 'integer',
    tuesday: 'integer',
    wednesday: 'integer',
    thursday: 'integer',
    friday: 'integer',
    saturday: 'integer',
    sunday: 'integer'
  },
  calendar_dates: {exception_type: 'integer'},
  shapes: {
    shape_pt_lat: 'float',
    shape_pt_lon: 'float',
    shape_pt_sequence: 'integer',
    shape_dist_traveled: 'float'
  },
  frequencies: {
    start_time: 'time',
    end_time: 'time',
    headway_secs: 'integer',
    exact_times: 'integer'
  },
  feed_info: {}
};
