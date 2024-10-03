// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema} from '../types/schema';
import type {Batch} from '../types/batch';
import type {Feature} from './category-gis';
import type * as arrow from 'apache-arrow';

/** A general table */
export type Table =
  | RowTable
  | ArrayRowTable
  | ObjectRowTable
  | GeoJSONTable
  | ColumnarTable
  | ArrowTable;

/** A table organized as an array of rows */
export type RowTable = ArrayRowTable | ObjectRowTable | GeoJSONTable;

/** A table organized as an array of rows, each row is an array of values */
export type ArrayRowTable = {
  shape: 'array-row-table';
  schema?: Schema;
  data: any[][];
};

/** A table organized as an array of rows, each row is an object mapping columns to values */
export type ObjectRowTable = {
  shape: 'object-row-table';
  schema?: Schema;
  data: {[columnName: string]: any}[];
};

/**
 * A table organized as an array of rows, each row is a GeoJSON Feature
 * @note For compatibility with GeoJSON, rows are stored in `table.features` instead of `table.data`
 */
export type GeoJSONTable = {
  shape: 'geojson-table';
  schema?: Schema;
  /** For compatibility with GeoJSON, the type field must always be set to `FeatureCollection` */
  type: 'FeatureCollection';
  /** For compatibility with GeoJSON, rows are stored in `table.features` instead of `table.data` */
  features: Feature[];
};

/** A table organized as a map of columns, each column is an array of value */
export type ColumnarTable = {
  shape: 'columnar-table';
  schema?: Schema;
  data: {[columnName: string]: ArrayLike<unknown>};
};

/**
 * A table that wraps an Apache Arrow table
 */
export type ArrowTable = {
  shape: 'arrow-table';
  schema?: Schema;
  data: arrow.Table;
};

/** A collection of tables */
export type Tables<TableType = Table> = {
  shape: 'tables';
  tables: {name: string; table: TableType}[];
};

// Batches

/** Batch for a general table */
export type TableBatch =
  | ArrayRowTableBatch
  | ObjectRowTableBatch
  | GeoJSONTableBatch
  | ColumnarTableBatch
  | ArrowTableBatch;

/** Batch for a table organized as an array of rows, each row is an array of values */
export type ArrayRowTableBatch = Batch & {
  shape: 'array-row-table';
  schema?: Schema;
  schemaType?: 'explicit' | 'deduced';
  data: any[][];
  length: number;
};

/** Batch for a table organized as an array of rows, each row is an object mapping columns to values */
export type ObjectRowTableBatch = Batch & {
  shape: 'object-row-table';
  schema?: Schema;
  schemaType?: 'explicit' | 'deduced';
  data: {[columnName: string]: any}[];
  length: number;
};

/** Batch for a table organized as an array of rows, each row is an array of values */
export type GeoJSONTableBatch = Batch & {
  shape: 'geojson-table';
  schema?: Schema;
  schemaType?: 'explicit' | 'deduced';
  type: 'FeatureCollection';
  features: Feature[];
  length: number;
};

/** Batch for a table organized as a map of columns, each column is an array of value */
export type ColumnarTableBatch = Batch & {
  shape: 'columnar-table';
  schemaType?: 'explicit' | 'deduced';
  schema?: Schema;
  data: {[columnName: string]: ArrayLike<unknown>};
  length: number;
};

/** Batch that wraps an Apache Arrow RecordBatch */
export type ArrowTableBatch = Batch & {
  shape: 'arrow-table';
  schemaType?: 'explicit' | 'deduced';
  schema?: Schema;
  data: arrow.Table; // RecordBatch wrapped in Table
  length: number;
};
