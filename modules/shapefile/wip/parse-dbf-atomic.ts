import BinaryReader from '../../streaming/binary-reader';

const LITTLE_ENDIAN = true;
const DBF_HEADER_SIZE = 32;

export default function parseDbf(arrayBuffer, options) {
  const binaryReader = new BinaryReader(arrayBuffer);

  const loaderOptions = options.dbf || {};
  const {encoding} = loaderOptions;

  // Global header
  const fileHeaderView = binaryReader.getDataView(DBF_HEADER_SIZE);
  const header = parseDBFHeader(fileHeaderView);
  const {headerLength, recordLength, nRecords} = header;

  // Row headers
  const textDecoder = new TextDecoder(encoding);
  const colHeaderView = binaryReader.getDataView(headerLength - DBF_HEADER_SIZE);
  const fields = parseColumnHeaders(colHeaderView, textDecoder);

  // Not exactly sure why start offset needs to be headerLength + 1?
  // parsedbf uses ((fields.length + 1) << 5) + 2;
  binaryReader.skip(1);

  return parseRows(binaryReader, fields, nRecords, recordLength, textDecoder);
}

/**
 * @param {DataView} headerView
 */
function parseDBFHeader(headerView) {
  return {
    // Last updated date
    year: headerView.getUint8(1) + 1900,
    month: headerView.getUint8(2),
    day: headerView.getUint8(3),
    // Number of records in data file
    nRecords: headerView.getUint32(4, LITTLE_ENDIAN),
    // Length of header in bytes
    headerLength: headerView.getUint16(8, LITTLE_ENDIAN),
    // Length of each record
    recordLength: headerView.getUint16(10, LITTLE_ENDIAN),
    // Not sure if this is usually set
    languageDriver: headerView.getUint8(29)
  };
}

/**
 * @param {DataView} view
 */
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

/**
 * @param {BinaryReader} binaryReader
 */
function parseRows(binaryReader, fields, nRecords, recordLength, textDecoder) {
  const rows = [];
  for (let i = 0; i < nRecords; i++) {
    const recordView = binaryReader.getDataView(recordLength - 1);
    binaryReader.skip(1);
    rows.push(parseRow(recordView, fields, textDecoder));
  }
  return rows;
}

/**
 * @param {DataView} view
 */
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

/**
 * Parse one field
 * @param {string} text
 * @param {*} dataType
 * @todo Should NaN be coerced to null?
 */
function parseField(text, dataType) {
  switch (dataType) {
    case 'B':
      return parseNumber(text);
    case 'C':
      return parseCharacter(text);
    case 'F':
      return parseNumber(text);
    case 'N':
      return parseNumber(text);
    case 'O':
      return parseNumber(text);
    case 'D':
      return parseDate(text);
    case 'L':
      return parseBoolean(text);
    default:
      throw new Error('Unsupported data type');
  }
}

/**
 * Parse YYYYMMDD to date in milliseconds
 * @param {*} str
 */
function parseDate(str) {
  return Date.UTC(str.slice(0, 4), parseInt(str.slice(4, 6), 10) - 1, str.slice(6, 8));
}

/**
 * Read boolean value
 * any of Y, y, T, t coerce to true
 * any of N, n, F, f coerce to false
 * otherwise null
 * @param {*} value
 */
function parseBoolean(value) {
  return /^[nf]$/i.test(value) ? false : /^[yt]$/i.test(value) ? true : null;
}

/**
 * Return null instead of NaN
 * @param {*} text
 */
function parseNumber(text) {
  const number = parseFloat(text);
  return isNaN(number) ? null : number;
}

function parseCharacter(text) {
  return text.trim() || null;
}
