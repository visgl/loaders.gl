export type Field = any;

export type Schema = {
  [key: string]: Field;
};

export type Batch = {
  data: any;
  schema: Schema;
  length: number;
  bytesUsed?: number;
};

export interface IBatchBuilder {
  addRow(row): void;

  chunkComplete(chunk: ArrayBuffer | string): void;

  isFull(): boolean;

  hasBatch(): boolean;

  getBatch(): Batch | null;
}
