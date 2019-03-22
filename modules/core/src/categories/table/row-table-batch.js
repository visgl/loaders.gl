export default class RowTableBatch {
  constructor(schema, batchSize) {
    this.schema = schema;
    this.batchSize = batchSize;
    this.rows = null;
    this.length = 0;
  }

  addRow(row) {
    if (!this.rows) {
      this.rows = new Array(this.batchSize);
      this.length = 0;
    }
    this.rows[this.length] = row;
    this.length++;
  }

  isFull() {
    return this.rows && this.length >= this.batchSize;
  }

  getNormalizedBatch() {
    if (this.rows) {
      const rows = this.rows.slice(0, this.length);
      this.rows = null;
      return {data: rows, schema: this.schema, length: rows.length};
    }
    return null;
  }
}
