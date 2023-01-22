// loaders.gl, MIT license

import type {Batch, Schema} from '../common-types';
import type {Table as ApacheArrowTable, RecordBatch} from 'apache-arrow';
import type {AnyArray} from '../../types';
import type {Feature} from '../gis';

// Idea was to just import types, but it seems
// Seems this triggers more bundling and build issues than it is worth...
// import type {Table as ApacheArrowTable, RecordBatch} from 'apache-arrow';
// type ApacheArrowTable = any;
// type RecordBatch = any;

/** A general table */
export type Table =
  | RowTable
  | ArrayRowTable
  | ObjectRowTable
  | GeoJSONRowTable
  | ColumnarTable
  | ArrowTable;

/** A table organized as an array of rows */
export type RowTable = ArrayRowTable | ObjectRowTable | GeoJSONRowTable;

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

/** A table organized as an array of rows, each row is a GeoJSON Feature */
export type GeoJSONRowTable = {
  shape: 'geojson-row-table';
  schema?: Schema;
  data: Feature[];
};

/** A table organized as a map of columns, each column is an array of value */
export type ColumnarTable = {
  shape: 'columnar-table';
  schema?: Schema;
  data: {[columnName: string]: AnyArray};
};

/** A table organized as an Apache Arrow table */
export type ArrowTable = {
  shape: 'arrow-table';
  schema?: Schema;
  data: ApacheArrowTable;
};

/** A collection of tables */
export type Tables<TableType = Table> = {
  shape: 'tables';
  tables: {name: string; table: TableType}[];
};

// Batches

/** Batch for a general table */
export type TableBatch = Batch & {
  data: any;
  length: number;
  schema?: Schema;
  schemaType?: 'explicit' | 'deduced';
};

/** Batch for a table organized as an array of rows */
export type RowTableBatch = TableBatch & {
  shape: 'row-table';
  data: any[];
};

/** Batch for a table organized as an array of rows, each row is an array of values */
export type RowArrayTableBatch = RowTableBatch & {
  shape: 'array-row-table';
  data: any[][];
};

/** Batch for a table organized as an array of rows, each row is an object mapping columns to values */
export type RowObjectTableBatch = RowTableBatch & {
  shape: 'object-row-table';
  data: {[columnName: string]: any}[];
};

/** Batch for a table organized as an array of rows, each row is an array of values */
export type GeoJSONRowTableBatch = RowTableBatch & {
  shape: 'geojson-row-table';
  data: Feature[];
};

/** Batch for a table organized as a map of columns, each column is an array of value */
export type ColumnarTableBatch = TableBatch & {
  shape: 'columnar-table';
  data: {[columnName: string]: AnyArray};
};

/** Batch for a table organized as an Apache Arrow table */
export type ArrowTableBatch = TableBatch & {
  shape: 'arrow-table';
  data: RecordBatch;
};
