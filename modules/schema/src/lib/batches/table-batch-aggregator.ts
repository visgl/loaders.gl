import type {Schema} from '../schema/schema';
import type {TableBatch} from '../../category/table/table-types';

export interface TableBatchOptions {
  batchSize: number | string;
  [key: string]: any;
}

export interface TableBatchConstructor {
  new (schema: Schema, options: TableBatchOptions): TableBatchAggregator;
}

/**
 * TableBatchBuilder delegates batch building to this interface
 */
export interface TableBatchAggregator {
  /** Number of rows */
  rowCount(): number;
  /** Add one row */
  addArrayRow(row: any[]): void;
  /** Add one row */
  addObjectRow(row: {[columnName: string]: any}): void;
  /** return a batch object */
  getBatch(): TableBatch | null;
}
