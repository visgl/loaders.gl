"use strict";module.export({default:()=>ColumnarTableBatch});class ColumnarTableBatch {
  constructor(schema, batchSize) {
    this.schema = schema;
    this.batchSize = batchSize;

    this.length = 0;
    this.allocated = 0;
    this.columns = null;

    this.reallocateColumns();
  }

  addRow(row) {
    // If user keeps pushing rows beyond batch size, reallocate
    this.reallocateColumns();
    for (const fieldName in row) {
      this.columns[fieldName] = row[fieldName];
    }
    this.length++;
  }

  // Is this TableBatch full?
  isFull() {
    return this.length >= this.allocated;
  }

  getNormalizedBatch() {
    const columns = this.columns;
    this.columns = null;
    // TODO - Ensure column lengths are set to the actual loaded size
    // this.pruneColumns();
    return {data: columns, schema: this.schema, length: this.length};
  }

  // HELPERS

  reallocateColumns() {
    if (this.length < this.allocated) {
      return;
    }

    this.allocated = this.allocated > 0 ? (this.allocated *= 2) : this.batchSize;
    this.columns = {};

    for (const fieldName in this.schema) {
      const field = this.schema[fieldName];
      const ArrayType = field.type || Float32Array;
      // const oldColumn = this.columns[fieldName];
      this.columns[fieldName] = new ArrayType(this.allocated);

      // Copy the old data to the new array
      // if (oldColumn) {
      //   copy(this.columns[fieldName], oldColumn);
      // }
    }
  }

  pruneColumns() {
    return this.columns;
  }
}
