// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {Field, ObjectRowTable, ObjectRowTableBatch} from '@loaders.gl/schema';
import {Schema} from '@loaders.gl/schema';
import {BinaryChunkReader} from '../streaming/binary-chunk-reader';

type DBFParserOptions = {
  shape?: 'object-row-table';
  encoding?: string;
};

export type DBFResult = {
  data: {[key: string]: unknown[]}[];
  schema?: Schema;
  error?: string;
  dbfHeader?: DBFHeader;
  dbfFields?: DBFField[];
  progress: {
    bytesUsed: number;
    rowsTotal: number;
    rows: number;
  };
};

/** Binary header stored in DBF file */
export type DBFHeader = {
  /** Last updated date - year */
  year: number;
  /** Last updated date - month */
  month: number;
  /** Last updated date - day */
  day: number;
  /** Number of records in data file */
  nRecords: number;
  /** Length of header in bytes */
  headerLength: number;
  /** Length of each record */
  recordLength: number;
  /** Not clear if this is usually set */
  languageDriver: number;
};

/** Field descriptor */
export type DBFField = {
  name: string;
  dataType: string;
  fieldLength: number;
  decimal: number;
};

const LITTLE_ENDIAN = true;
const DBF_HEADER_SIZE = 32;

enum STATE {
  START = 0, // Expecting header
  FIELD_DESCRIPTORS = 1,
  FIELD_PROPERTIES = 2,
  END = 3,
  ERROR = 4
}

class DBFParser {
  binaryReader = new BinaryChunkReader();
  textDecoder: TextDecoder;
  state = STATE.START;
  result: DBFResult = {
    data: [],
    progress: {
      bytesUsed: 0,
      rowsTotal: 0,
      rows: 0
    }
  };

  constructor(options: {encoding: string}) {
    this.textDecoder = new TextDecoder(options.encoding);
  }

  /**
   * @param arrayBuffer
   */
  write(arrayBuffer: ArrayBuffer): void {
    this.binaryReader.write(arrayBuffer);
    this.state = parseState(this.state, this.result, this.binaryReader, this.textDecoder);
    // this.result.progress.bytesUsed = this.binaryReader.bytesUsed();

    // important events:
    // - schema available
    // - first rows available
    // - all rows available
  }

  end(): void {
    this.binaryReader.end();
    this.state = parseState(this.state, this.result, this.binaryReader, this.textDecoder);
    // this.result.progress.bytesUsed = this.binaryReader.bytesUsed();
    if (this.state !== STATE.END) {
      this.state = STATE.ERROR;
      this.result.error = 'DBF incomplete file';
    }
  }
}

/**
 * @param arrayBuffer
 * @param options
 * @returns DBFTable or rows
 */
export function parseDBF(arrayBuffer: ArrayBuffer, options: DBFParserOptions = {}): ObjectRowTable {
  const {encoding = 'latin1'} = options.dbf || {};

  const dbfParser = new DBFParser({encoding});
  dbfParser.write(arrayBuffer);
  dbfParser.end();

  const {data, schema} = dbfParser.result;
  const shape = options?.shape || 'object-row-table';
  switch (shape) {
    case 'object-row-table': {
      const table: ObjectRowTable = {
        shape: 'object-row-table',
        schema,
        data
      };
      return table;
    }
    default:
      throw new Error(shape);
  }
  const table: ObjectRowTable = {
    shape: 'object-row-table',
    schema,
    data
  };
  return table;
}

/**
 * @param asyncIterator
 * @param options
 */
export async function* parseDBFInBatches(
  asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  options: DBFParserOptions = {}
): AsyncIterableIterator<ObjectRowTableBatch> {
  const {encoding = 'latin1'} = option;

  const parser = new DBFParser({encoding});
  let headerReturned = false;
  for await (const arrayBuffer of asyncIterator) {
    parser.write(arrayBuffer);
    if (!headerReturned && parser.result.dbfHeader) {
      headerReturned = true;
      yield {
        batchType: 'metadata',
        shape: 'object-row-table',
        data: [],
        length: 0,
        // Additional data
        dbfHeader: parser.result.dbfHeader
      };
    }

    if (parser.result.data.length > 0) {
      const data = parser.result.data;
      parser.result.data = [];
      yield {
        batchType: 'data',
        shape: 'object-row-table',
        data,
        length: data.length
      };
    }
  }
  parser.end();
  if (parser.result.data.length > 0) {
    const data = parser.result.data;
    yield {
      batchType: 'data',
      shape: 'object-row-table',
      data,
      length: data.length
    };
  }
}

/**
 * State machine for DBF parsing
 * @param state
 * @param result
 * @param binaryReader
 * @param textDecoder
 * @returns
 * @see https://www.dbase.com/Knowledgebase/INT/db7_file_fmt.htm
 */
/* eslint-disable complexity, max-depth */
function parseState(
  state: STATE,
  result: DBFResult,
  binaryReader: BinaryChunkReader,
  textDecoder: TextDecoder
): STATE {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      switch (state) {
        case STATE.ERROR:
        case STATE.END:
          return state;

        case STATE.START:
          // Parse initial file header
          // DBF Header
          const dataView = binaryReader.getDataView(DBF_HEADER_SIZE);
          if (!dataView) {
            return state;
          }
          result.dbfHeader = parseDBFHeader(dataView);
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
            result.dbfHeader!.headerLength - DBF_HEADER_SIZE
          );
          if (!fieldDescriptorView) {
            return state;
          }

          result.dbfFields = parseFieldDescriptors(fieldDescriptorView, textDecoder);
          result.schema = {
            fields: result.dbfFields.map((dbfField) => makeField(dbfField)),
            metadata: {}
          };

          state = STATE.FIELD_PROPERTIES;

          // TODO(kyle) Not exactly sure why start offset needs to be headerLength + 1?
          // parsedbf uses ((fields.length + 1) << 5) + 2;
          binaryReader.skip(1);
          break;

        case STATE.FIELD_PROPERTIES:
          const {recordLength = 0, nRecords = 0} = result?.dbfHeader || {};
          while (result.data.length < nRecords) {
            const recordView = binaryReader.getDataView(recordLength - 1);
            if (!recordView) {
              return state;
            }
            // Note: Avoid actually reading the last byte, which may not be present
            binaryReader.skip(1);

            const row = parseRow(recordView, result.dbfFields || [], textDecoder);
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
      result.error = `DBF parsing failed: ${(error as Error).message}`;
      return state;
    }
  }
}

/**
 * @param headerView
 */
function parseDBFHeader(headerView: DataView): DBFHeader {
  return {
    year: headerView.getUint8(1) + 1900,
    month: headerView.getUint8(2),
    day: headerView.getUint8(3),
    nRecords: headerView.getUint32(4, LITTLE_ENDIAN),
    headerLength: headerView.getUint16(8, LITTLE_ENDIAN),
    recordLength: headerView.getUint16(10, LITTLE_ENDIAN),
    languageDriver: headerView.getUint8(29)
  };
}

/**
 * @param view
 */
function parseFieldDescriptors(view: DataView, textDecoder: TextDecoder): DBFField[] {
  // NOTE: this might overestimate the number of fields if the "Database
  // Container" container exists and is included in the headerLength
  const nFields = (view.byteLength - 1) / 32;
  const fields: DBFField[] = [];
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
    rows.push(parseRow(recordView, fields, textDecoder));
  }
  return rows;
}
 */

/**
 *
 * @param view
 * @param fields
 * @param textDecoder
 * @returns
 */
function parseRow(
  view: DataView,
  fields: DBFField[],
  textDecoder: TextDecoder
): {[key: string]: any} {
  const out: {[key: string]: string | number | boolean | null} = {};
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
 * Should NaN be coerced to null?
 * @param text
 * @param dataType
 * @returns Field depends on a type of the data
 */
function parseField(text: string, dataType: string): string | number | boolean | null {
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
 * @param str YYYYMMDD
 * @returns new Date as a number
 */
function parseDate(str: any): number {
  return Date.UTC(str.slice(0, 4), parseInt(str.slice(4, 6), 10) - 1, str.slice(6, 8));
}

/**
 * Read boolean value
 * any of Y, y, T, t coerce to true
 * any of N, n, F, f coerce to false
 * otherwise null
 * @param value
 * @returns boolean | null
 */
function parseBoolean(value: string): boolean | null {
  return /^[nf]$/i.test(value) ? false : /^[yt]$/i.test(value) ? true : null;
}

/**
 * Return null instead of NaN
 * @param text
 * @returns number | null
 */
function parseNumber(text: string): number | null {
  const number = parseFloat(text);
  return isNaN(number) ? null : number;
}

/**
 *
 * @param text
 * @returns string | null
 */
function parseCharacter(text: string): string | null {
  return text.trim() || null;
}

/**
 * Create a standard Arrow-style `Field` from field descriptor.
 * TODO - use `fieldLength` and `decimal` to generate smaller types?
 * @param param0
 * @returns Field
 */
// eslint-disable
function makeField({name, dataType, fieldLength, decimal}: DBFField): Field {
  switch (dataType) {
    case 'B':
      return {name, type: 'float64', nullable: true, metadata: {}};
    case 'C':
      return {name, type: 'utf8', nullable: true, metadata: {}};
    case 'F':
      return {name, type: 'float64', nullable: true, metadata: {}};
    case 'N':
      return {name, type: 'float64', nullable: true, metadata: {}};
    case 'O':
      return {name, type: 'float64', nullable: true, metadata: {}};
    case 'D':
      return {name, type: 'timestamp-millisecond', nullable: true, metadata: {}};
    case 'L':
      return {name, type: 'bool', nullable: true, metadata: {}};
    default:
      throw new Error('Unsupported data type');
  }
}
