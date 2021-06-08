export type Field = any;

export type Schema = {
  [key: string]: Field;
};

export type Batch = {
  data: any;
  schema: Schema;
  length: number;
  bytesUsed?: number;
  count?: number;
  cursor?: number;
};

export interface TableBatchOptions {}

export interface TableBatchConstructor {
  new (schema: Schema, options?: TableBatchOptions): TableBatch;
}

/**
 * TableBatchBuilder builds batches conforming to this interface
 */
export interface TableBatch {
  addRow(row): void;

  chunkComplete(): void;

  isFull(): boolean;

  // hasBatch(): boolean;

  getBatch(): Batch | null;
}
