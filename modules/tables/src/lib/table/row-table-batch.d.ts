import {Schema, Batch, IBatchBuilder} from './table-types';

export default class TableBatchBuilder implements IBatchBuilder {
  constructor(schema: Schema, options?: object);

  addRow(row): void;

  chunkComplete(chunk: ArrayBuffer | string): void;

  isFull(): boolean;

  hasBatch(): boolean;

  getBatch(): Batch | null;
}
