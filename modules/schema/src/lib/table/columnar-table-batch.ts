import {TableBatch, Schema, Batch} from './table-batch';

type ColumnarTableBatchOptions = {
  batchSize?: number | string;
};

export default class ColumnarTableBatch implements TableBatch {
  schema: Schema;
  batchSize: number | string;
  length: number;
  allocated: number | string;
  columns: Array<any>;
  isChunkComplete: boolean;

  constructor(schema: Schema, options: ColumnarTableBatchOptions = {}) {
    this.schema = schema;
    this.batchSize = options.batchSize || 'auto';
    this.length = 0;
    this.allocated = 0;
    this.columns = [];
    this.isChunkComplete = false;

    this._reallocateColumns();
  }

  addRow(row: any[] | object): void {
    // If user keeps pushing rows beyond batch size, reallocate
    this._reallocateColumns();
    for (const fieldName in row) {
      this.columns[fieldName][this.length] = row[fieldName];
    }
    this.length++;
  }

  chunkComplete(): void {
    this.isChunkComplete = true;
  }

  // Is this TableBatch full?
  isFull(): boolean {
    if (this.batchSize === 'auto') {
      return this.isChunkComplete;
    }
    return this.length >= this.allocated;
  }

  getBatch(): Batch | null {
    this._pruneColumns();
    const columns = Array.isArray(this.schema) ? this.columns : {};

    // schema is an array if there're no headers
    // object if there are headers
    // columns should match schema format
    if (!Array.isArray(this.schema)) {
      for (const fieldName in this.schema) {
        const field = this.schema[fieldName];
        columns[field.name] = this.columns[field.index];
      }
    }

    this.columns = [];
    this.isChunkComplete = false;

    return {data: columns, schema: this.schema, length: this.length};
  }

  // HELPERS

  _reallocateColumns() {
    if (this.length < this.allocated) {
      return;
    }

    // @ts-ignore TODO
    this.allocated = this.allocated > 0 ? (this.allocated *= 2) : this.batchSize;
    this.columns = [];

    for (const fieldName in this.schema) {
      const field = this.schema[fieldName];
      const ArrayType = field.type || Float32Array;
      const oldColumn = this.columns[field.index];

      if (oldColumn && ArrayBuffer.isView(oldColumn)) {
        // Copy the old data to the new array
        const typedArray = new ArrayType(this.allocated);
        typedArray.set(oldColumn);
        this.columns[field.index] = typedArray;
      } else if (oldColumn) {
        // Plain array
        oldColumn.length = this.allocated;
        this.columns[field.index] = oldColumn;
      } else {
        // Create new
        this.columns[field.index] = new ArrayType(this.allocated);
      }
    }
  }

  _pruneColumns() {
    this.columns = this.columns.map((column) => column.slice(0, this.length));
  }
}
