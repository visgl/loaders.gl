import {Schema, Batch, IBatchBuilder} from './table-types';

export default class ColumnarTableBatch  implements IBatchBuilder{
  constructor(schema: Schema, options?: object);

  addRow(row: any[] | object): void;

  chunkComplete(chunk: ArrayBuffer | string): void;

  isFull(): boolean;

  hasBatch(): boolean;

  getBatch(): Batch | null;
}
