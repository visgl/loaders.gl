export default class RowTableBatch {
  constructor(schema, batchSize) {
    this.schema = schema;
    this.batchSize = batchSize;
    this.rows = null;
    this.length = 0;
    this.isChunkComplete = false;

    // schema is an array if there're no headers
    // object if there are headers
    if (!Array.isArray(schema)) {
      this._headers = [];
      for (const key in schema) {
        this._headers[schema[key].index] = schema[key].name;
      }
    }
  }

  addRow(row) {
    if (!this.rows) {
      this.rows = new Array(this.batchSize);
      this.length = 0;
    }
    this.rows[this.length] = convertRowToObject(row, this._headers);
    this.length++;
  }

  chunkComplete() {
    this.isChunkComplete = true;
  }

  isFull() {
    if (this.batchSize === 'auto') {
      return this.isChunkComplete;
    }
    return this.rows && this.length >= this.batchSize;
  }

  getNormalizedBatch() {
    if (this.rows) {
      const rows = this.rows.slice(0, this.length);
      this.rows = null;
      this.isChunkComplete = false;
      return {data: rows, schema: this.schema, length: rows.length};
    }
    return null;
  }
}

function convertRowToObject(row, headers) {
  if (!row) {
    throw new Error('null row');
  }
  if (!Array.isArray(row)) {
    return row;
  }

  if (!headers) {
    return row;
  }
  const result = {};
  for (let i = 0; i < headers.length; i++) {
    result[headers[i]] = row[i];
  }
  return result;
}
