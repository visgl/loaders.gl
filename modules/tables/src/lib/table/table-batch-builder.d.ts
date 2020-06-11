import {Schema, Batch} from './table-types';

export default class TableBatchBuilder {
  constructor(TableBatchType, schema: Schema, options?: object);

  addRow(row, meta): void;

  chunkComplete(chunk: ArrayBuffer | string): void;

  isFull(): boolean;

  hasBatch(): boolean;

  getNormalizedBatch(): Batch | null;
}
