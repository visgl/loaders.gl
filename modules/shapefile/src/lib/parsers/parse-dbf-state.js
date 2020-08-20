/* global TextDecoder */
import BinaryChunkReader from '../streaming/binary-chunk-reader';

const LITTLE_ENDIAN = true;
const DBF_HEADER_SIZE = 32;

const STATE = {
  START: 0, // Expecting header
  FIELD_DESCRIPTORS: 1,
  FIELD_PROPERTIES: 2,
  END: 3,
  ERROR: 4
};

class DBFParser {
  constructor({encoding}) {
    this.binaryReader = new BinaryChunkReader();
    this.textDecoder = new TextDecoder(encoding);
    this.state = STATE.START;
    this.result = {};
  }

  write(arrayBuffer) {
    this.binaryReader.write(arrayBuffer);
    this.state = parseState(this.state, this.result, this.binaryReader, this.textDecoder);
    // this.result.progress.bytesUsed = this.binaryReader.bytesUsed();

    // important events:
    // - schema available
    // - first rows available
    // - all rows available
  }

  end() {
    this.binaryReader.end();
    this.state = parseState(this.state, this.result, this.binaryReader, this.textDecoder);
    // this.result.progress.bytesUsed = this.binaryReader.bytesUsed();
    if (this.state !== STATE.END) {
      this.state = STATE.ERROR;
      this.result.error = 'DBF incomplete file';
    }
  }
}

// https://www.dbase.com/Knowledgebase/INT/db7_file_fmt.htm
/* eslint-disable complexity, max-depth */
function parseState(state, result = {}, binaryReader, textDecoder) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      switch (state) {
        case STATE.ERROR:
        case STATE.END:
          return state;

        case STATE.START:
          // Parse initial file header
          const dataView = binaryReader.getDataView(DBF_HEADER_SIZE, 'DBF header');
          if (!dataView) {
            return state;
          }
          result.dbfHeader = parseDBFHeader(dataView);
          result.data = [];
          result.progress = {
            bytesUsed: 0,
            rowsTotal: result.dbfHeader.nRecords,
            rows: 0
          };
          state = STATE.FIELD_DESCRIPTORS;
          break;

        case STATE.FIELD_DESCRIPTORS:
          // Parse DBF field descriptors (schema)
          const fieldDescriptorView = binaryReader.getDataView(
            result.dbfHeader.headerLength - DBF_HEADER_SIZE,
            'DBF field descriptors'
          );
          if (!fieldDescriptorView) {
            return state;
          }

          result.dbfFields = parseFieldDescriptors(fieldDescriptorView, textDecoder);
          state = STATE.FIELD_PROPERTIES;

          // TODO(kyle) Not exactly sure why start offset needs to be headerLength + 1?
          // parsedbf uses ((fields.length + 1) << 5) + 2;
          binaryReader.skip(1);
          break;

        case STATE.FIELD_PROPERTIES:
          const {recordLength} = result.dbfHeader;
          while (result.data.length < result.dbfHeader.nRecords) {
            const recordView = binaryReader.getDataView(recordLength - 1);
            if (!recordView) {
              return state;
            }
            // Note: Avoid actually reading the last byte, which may not be present
            binaryReader.skip(1);

            const row = parseRow(recordView, result.dbfFields, textDecoder);
            result.data.push(row);
            result.progress.rows = result.data.length;
          }
          state = STATE.END;
          break;

        default:
          state = STATE.ERROR;
          result.error = `illegal parser state ${state}`;
          return state;
      }
    } catch (error) {
      state = STATE.ERROR;
      result.error = `DBF parsing failed: ${error.message}`;
      return state;
    }
  }
}

export default function parseDbf(arrayBuffer, options) {
  const loaderOptions = options.dbf || {};
  const {encoding} = loaderOptions;

  const dbfParser = new DBFParser({encoding});
  dbfParser.write(arrayBuffer);
  dbfParser.end();

  return dbfParser.result.data;
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
function parseFieldDescriptors(view, textDecoder) {
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

/*
 * @param {BinaryChunkReader} binaryReader
function parseRows(binaryReader, fields, nRecords, recordLength, textDecoder) {
  const rows = [];
  for (let i = 0; i < nRecords; i++) {
    const recordView = binaryReader.getDataView(recordLength - 1);
    binaryReader.skip(1);
    // @ts-ignore
    rows.push(parseRow(recordView, fields, textDecoder));
  }
  return rows;
}
 */

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

// Should NaN be coerced to null?
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

// Parse YYYYMMDD to date in milliseconds
function parseDate(str) {
  return Date.UTC(str.slice(0, 4), parseInt(str.slice(4, 6), 10) - 1, str.slice(6, 8));
}

// Read boolean value
// any of Y, y, T, t coerce to true
// any of N, n, F, f coerce to false
// otherwise null
function parseBoolean(value) {
  return /^[nf]$/i.test(value) ? false : /^[yt]$/i.test(value) ? true : null;
}

// Return null instead of NaN
function parseNumber(text) {
  const number = parseFloat(text);
  return isNaN(number) ? null : number;
}

function parseCharacter(text) {
  return text.trim() || null;
}
