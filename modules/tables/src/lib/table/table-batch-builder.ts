import {TableBatch, TableBatchConstructor, Schema, Batch} from './table-batch';

// TODO define interface instead
type GetBatchOptions = {
  bytesUsed?: number;
  [key: string]: any;
};

const DEFAULT_BATCH_SIZE = 100;

const DEFAULT_OPTIONS = {
  batchSize: DEFAULT_BATCH_SIZE
};

export default class TableBatchBuilder {
  TableBatchType: TableBatchConstructor;
  schema: Schema;
  options: GetBatchOptions;

  batch: TableBatch | null;
  batchCount: number;
  bytesUsed: number;

  constructor(
    TableBatchType: TableBatchConstructor,
    schema: Schema,
    options: GetBatchOptions = {}
  ) {
    this.TableBatchType = TableBatchType;
    this.schema = schema;
    this.options = {...DEFAULT_OPTIONS, ...options};

    this.batch = null;
    this.batchCount = 0;
    this.bytesUsed = 0;
  }

  addRow(row): void {
    if (!this.batch) {
      const {TableBatchType} = this;
      this.batch = new TableBatchType(this.schema, this.options);
    }
    this.batch.addRow(row);
  }

  chunkComplete(chunk: ArrayBuffer | string): void {
    if (chunk instanceof ArrayBuffer) {
      this.bytesUsed += chunk.byteLength;
    }
    if (typeof chunk === 'string') {
      this.bytesUsed += chunk.length;
    }
    if (this.batch) {
      this.batch.chunkComplete();
    }
  }

  isFull(): boolean {
    return Boolean(this.batch && this.batch.isFull());
  }

  hasBatch(): boolean {
    return Boolean(this.batch);
  }

  /**
   * bytesUsed can be set via chunkComplete or via getBatch
   */
  getBatch(options: GetBatchOptions = {}): Batch | null {
    if (Number.isFinite(options.bytesUsed)) {
      this.bytesUsed = options.bytesUsed as number;
    }

    if (this.batch) {
      const normalizedBatch = this.batch.getBatch() as Batch;
      this.batch = null;
      normalizedBatch.count = this.batchCount;
      this.batchCount++;
      normalizedBatch.bytesUsed = this.bytesUsed;
      Object.assign(normalizedBatch, options);
      return normalizedBatch;
    }

    return null;
  }
}
