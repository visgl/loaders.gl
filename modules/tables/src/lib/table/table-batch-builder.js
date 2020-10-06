const DEFAULT_BATCH_SIZE = 100;

const DEFAULT_OPTIONS = {
  batchSize: DEFAULT_BATCH_SIZE
};

export default class TableBatchBuilder {
  constructor(TableBatchType, schema, options = {}) {
    this.TableBatchType = TableBatchType;
    this.schema = schema;
    this.options = {...DEFAULT_OPTIONS, ...options};

    this.batch = null;
    this.batchCount = 0;
    this.bytesUsed = 0;
  }

  addRow(row) {
    if (!this.batch) {
      const {TableBatchType} = this;
      this.batch = new TableBatchType(this.schema, this.options);
    }

    this.batch.addRow(row);
  }

  chunkComplete(chunk) {
    this.bytesUsed += chunk.byteLength || chunk.length || 0;
    if (this.batch) {
      this.batch.chunkComplete();
    }
  }

  isFull() {
    return this.batch && this.batch.isFull();
  }

  hasBatch() {
    return Boolean(this.batch);
  }

  getBatch(options = {}) {
    if (Number.isFinite(options.bytesUsed)) {
      this.bytesUsed = options.bytesUsed;
    }

    if (this.batch) {
      const normalizedBatch = this.batch.getBatch();
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
