import type {Schema} from '../lib/schema';
import type {Table as ApacheArrowTable, RecordBatch} from 'apache-arrow';
import type {AnyArray} from '../types';
import type {Batch} from './common';

/** A general table */
export interface Table {
  shape: 'row-table' | 'array-row-table' | 'object-row-table' | 'columnar-table' | 'arrow-table';
  schema?: Schema;
  schemaType?: 'explicit' | 'deduced';
}

/** A table organized as an array of rows */
export interface RowTable extends Table {
  shape: 'row-table' | 'array-row-table' | 'object-row-table';
  data: any[];
}

/** A table organized as an array of rows, each row is an array of values */
export interface ArrayRowTable extends RowTable {
  shape: 'array-row-table';
  data: any[][];
}

/** A table organized as an array of rows, each row is an object mapping columns to values */
export interface ObjectRowTable extends RowTable {
  shape: 'object-row-table';
  data: {[columnName: string]: any}[];
}

/** A table organized as a map of columns, each column is an array of value */
export interface ColumnarTable extends Table {
  shape: 'columnar-table';
  data: {[columnName: string]: AnyArray};
}

/** A table organized as an Apache Arrow table */
export interface ArrowTable extends Table {
  shape: 'arrow-table';
  data: ApacheArrowTable;
}

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
