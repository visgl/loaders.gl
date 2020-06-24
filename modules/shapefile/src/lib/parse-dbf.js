/* global TextDecoder */

const LITTLE_ENDIAN = true;

export default function parseDbf(arrayBuffer, options) {
  const {encoding} = options;

  // Global header
  const globalHeaderView = new DataView(arrayBuffer, 0, 32);
  const header = parseHeader(globalHeaderView);
  const {headerLength, recordLength, nRecords} = header;

  // Row headers
  const textDecoder = new TextDecoder(encoding);
  const colHeaderView = new DataView(arrayBuffer, 32, headerLength - 32);
  const colHeaders = parseColumnHeaders(colHeaderView, textDecoder);

  // Not exactly sure why start offset needs to be headerLength + 1?
  // parsedbf uses ((colHeaders.length + 1) << 5) + 2;
  const recordsView = new DataView(arrayBuffer, headerLength + 1);
  return parseRows(recordsView, colHeaders, nRecords, recordLength, textDecoder);
}

function parseHeader(headerView) {
  // Last updated date
  const year = headerView.getUint8(1) + 1900;
  const month = headerView.getUint8(2);
  const day = headerView.getUint8(3);

  // Number of records in data file
  const nRecords = headerView.getUint32(4, LITTLE_ENDIAN);
  // Length of header in bytes
  const headerLength = headerView.getUint16(8, LITTLE_ENDIAN);
  // Length of each record
  const recordLength = headerView.getUint16(10, LITTLE_ENDIAN);
  // Not sure if this is usually set
  const languageDriver = headerView.getUint8(29);

  return {
    year,
    month,
    day,
    nRecords,
    headerLength,
    recordLength,
    languageDriver
  };
}

function parseColumnHeaders(view, textDecoder) {
  // NOTE: this might overestimate the number of fields if the "Database
  // Container" container exists and is included in the headerLength
  const nFields = (view.byteLength - 1) / 32;
  const fields = [];
  let offset = 0;
  for (let i = 0; i < nFields; i++) {
    const name = textDecoder
      .decode(new Uint8Array(view.buffer, view.byteOffset + offset, 11))
      // eslint-disable-next-line no-control-regex
      .replace(/\u0000/g, '');

    fields.push({
      name,
      dataType: String.fromCharCode(view.getUint8(offset + 11)),
      fieldLength: view.getUint8(offset + 16),
      decimal: view.getUint8(offset + 17)
    });
    offset += 32;
  }
  return fields;
}

function parseRows(view, fields, nRecords, recordLength, textDecoder) {
  const rows = [];
  for (let i = 0; i < nRecords; i++) {
    const offset = i * recordLength;
    const recordView = new DataView(view.buffer, view.byteOffset + offset, recordLength);
    rows.push(parseRow(recordView, fields, textDecoder));
  }
  return rows;
}

function parseRow(view, fields, textDecoder) {
  const out = {};
  let offset = 0;
  for (const field of fields) {
    const text = textDecoder.decode(
      new Uint8Array(view.buffer, view.byteOffset + offset, field.fieldLength)
    );
    out[field.name] = parseField(text, field.dataType);
    offset += field.fieldLength;
  }

  return out;
}

function parseField(text, dataType) {
  switch (dataType) {
    case 'B':
      return Number(text);
    case 'C':
      return text.trim() || null;
    case 'F':
      return Number(text);
    case 'N':
      return Number(text);
    case 'O':
      return Number(text);
    case 'D':
      return parseDate(text);
    case 'L':
      return readBoolean(text);
    default:
      throw new Error('Unsupported data type');
  }
}

// Parse YYYYMMDD to date in milliseconds
function parseDate(str) {
  return new Date(str.slice(0, 4), parseInt(str.slice(4, 6), 10) - 1, str.slice(6, 8)).getTime();
}

// Read boolean value
// any of Y, y, T, t coerce to true
// any of N, n, F, f coerce to false
// otherwise null
function readBoolean(value) {
  return /^[nf]$/i.test(value) ? false : /^[yt]$/i.test(value) ? true : null;
}
