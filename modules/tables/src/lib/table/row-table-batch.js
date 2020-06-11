const DEFAULT_OPTIONS = {
  batchSize: 'auto',
  convertToObject: true
};

export default class RowTableBatch {
  constructor(schema, options = {}) {
    options = {...DEFAULT_OPTIONS, ...options};

    this.schema = schema;
    this.batchSize = options.batchSize;
    this.convertToObject = options.convertToObject;

    this.rows = null;
    this.length = 0;
    this.isChunkComplete = false;
    this.cursor = 0;

    // schema is an array if there're no headers
    // object if there are headers
    if (!Array.isArray(schema)) {
      this._headers = [];
      for (const key in schema) {
        this._headers[schema[key].index] = schema[key].name;
      }
    }
  }

  addRow(row, cursor = null) {
    if (!this.rows) {
      this.rows = new Array(this.batchSize);
      this.length = 0;
    }
    if (Number.isFinite(cursor)) {
      this.cursor = cursor;
    }

    this.rows[this.length] = this.convertToObject ? convertRowToObject(row, this._headers) : row;
    this.length++;
  }

  chunkComplete() {
    this.isChunkComplete = true;
  }

  isFull() {
    if (this.batchSize === 'auto') {
      return this.isChunkComplete && this.length > 0;
    }
    return this.rows && this.length >= this.batchSize;
  }

  getBatch() {
    if (this.rows) {
      const rows = this.rows.slice(0, this.length);
      this.rows = null;
      this.isChunkComplete = false;
      return {data: rows, schema: this.schema, length: rows.length, cursor: this.cursor};
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
