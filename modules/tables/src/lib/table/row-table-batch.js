export default class RowTableBatch {
  constructor(schema, batchSize) {
    this.schema = schema;
    this.batchSize = batchSize;
    this.rows = null;
    this.length = 0;

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

function convertRowToObject(row, headers) {
  if (!headers) {
    return row;
  }
  const result = {};
  for (let i = 0; i < headers.length; i++) {
    result[headers[i]] = row[i];
  }
  return result;
}
