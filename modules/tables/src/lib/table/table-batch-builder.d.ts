import {Schema, Batch, IBatchBuilder} from './table-types';

// TODO define interface instead
type GetBatchOptions = {
  bytesUsed?: number;
  [key: string]: any;
};

export default class TableBatchBuilder implements IBatchBuilder {
  constructor(TableBatchType, schema: Schema, options?: object);

  addRow(row): void;

  chunkComplete(chunk: ArrayBuffer | string): void;

  isFull(): boolean;

  hasBatch(): boolean;

  /**
   * bytesUsed can be set via chunkComplete or via getBatch
   */
  getBatch(options?: GetBatchOptions): Batch | null;
}
