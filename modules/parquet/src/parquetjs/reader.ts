// Forked from https://github.com/ironSource/parquetjs under MIT license
import parquetThrift from '../libs/parquet-types';
import {ParquetSchema} from './schema/schema';
import {materializeRecords} from './schema/shred';
import {PARQUET_CODECS} from './codecs';
import {inflate} from './compression';
import {fstat, fopen, fread, fclose} from './file';
import {fieldIndexOf, getThriftEnum, decodeThrift, getBitWidth} from './util';

/**
 * Parquet File Magic String
 */
const PARQUET_MAGIC = 'PAR1';

/**
 * Parquet File Format Version
 */
const PARQUET_VERSION = 1;

/**
 * Internal type used for repetition/definition levels
 */
const PARQUET_RDLVL_TYPE = 'INT32';
const PARQUET_RDLVL_ENCODING = 'RLE';

/**
 * A parquet cursor is used to retrieve rows from a parquet file in order
 */
export class ParquetCursor {
  metadata;
  envelopeReader;
  schema: ParquetSchema;
  columnList;
  rowGroup = [];
  rowGroupIndex = 0;

  /**
   * Create a new parquet reader from the file metadata and an envelope reader.
   * It is usually not recommended to call this constructor directly except for
   * advanced and internal use cases. Consider using getCursor() on the
   * ParquetReader instead
   */
  constructor(metadata, envelopeReader, schema, columnList) {
    this.metadata = metadata;
    this.envelopeReader = envelopeReader;
    this.schema = schema;
    this.columnList = columnList;
  }

  /**
   * Retrieve the next row from the cursor. Returns a row or NULL if the end
   * of the file was reached
   */
  async next(): Promise<any[] | null> {
    if (this.rowGroup.length === 0) {
      if (this.rowGroupIndex >= this.metadata.row_groups.length) {
        return null;
      }

      const rowBuffer = await this.envelopeReader.readRowGroup(
        this.schema,
        this.metadata.row_groups[this.rowGroupIndex],
        this.columnList
      );

      this.rowGroup = materializeRecords(this.schema, rowBuffer);
      this.rowGroupIndex++;
    }

    return this.rowGroup.shift() || null;
  }

  /**
   * Rewind the cursor the the beginning of the file
   */
  rewind() {
    this.rowGroup = [];
    this.rowGroupIndex = 0;
  }
}

/**
 * A parquet reader allows retrieving the rows from a parquet file in order.
 * The basic usage is to create a reader and then retrieve a cursor/iterator
 * which allows you to consume row after row until all rows have been read. It is
 * important that you call close() after you are finished reading the file to
 * avoid leaking file descriptors.
 */
export class ParquetReader {
  metadata;
  envelopeReader;
  schema;

  /**
   * Open the parquet file pointed to by the specified path and return a new
   * parquet reader
   */
  static async openFile(filePath): Promise<ParquetReader> {
    const fileStat = await fstat(filePath);
    const fileDescriptor = await fopen(filePath);

    const readFn = fread.bind(undefined, fileDescriptor);
    const closeFn = fclose.bind(undefined, fileDescriptor);

    return ParquetReader.open(readFn, closeFn, fileStat.size);
  }

  static async open(readFn, closeFn, size: number): Promise<ParquetReader> {
    const envelopeReader = new ParquetEnvelopeReader(readFn, closeFn, size);
    try {
      await envelopeReader.readHeader();
      const metadata = await envelopeReader.readFooter();
      return new ParquetReader(metadata, envelopeReader);
    } catch (err) {
      await envelopeReader.close();
      throw err;
    }
  }

  /**
   * Create a new parquet reader from the file metadata and an envelope reader.
   * It is not recommended to call this constructor directly except for advanced
   * and internal use cases. Consider using one of the open{File,Buffer} methods
   * instead
   */
  constructor(metadata, envelopeReader) {
    if (metadata.version !== PARQUET_VERSION) {
      throw new Error(`parquet: invalid version ${metadata.version}`);
    }

    this.metadata = metadata;
    this.envelopeReader = envelopeReader;
    this.schema = new ParquetSchema(decodeSchema(this.metadata.schema.splice(1)));
  }

  /**
   * Return a cursor to the file. You may open more than one cursor and use
   * them concurrently. All cursors become invalid once close() is called on
   * the reader object.
   *
   * The required_columns parameter controls which columns are actually read
   * from disk. An empty array or no value implies all columns. A list of column
   * names means that only those columns should be loaded from disk.
   */
  getCursor(columnList: any[] | any[][] = []): ParquetCursor {
    columnList = columnList.map((x) => (Array.isArray(x) ? x : [x]));

    return new ParquetCursor(this.metadata, this.envelopeReader, this.schema, columnList);
  }

  /**
   * Return the number of rows in this file. Note that the number of rows is
   * not neccessarily equal to the number of rows in each column.
   */
  getRowCount() {
    return this.metadata.num_rows;
  }

  /**
   * Returns the ParquetSchema for this file
   */
  getSchema() {
    return this.schema;
  }

  /**
   * Returns the user (key/value) metadata for this file
   */
  getMetadata(): {[key: string]: any} {
    const metadata: {[key: string]: any} = {};
    for (const kv of this.metadata.key_value_metadata) {
      metadata[kv.key] = kv.value;
    }
    return metadata;
  }

  /**
   * Close this parquet reader. You MUST call this method once you're finished
   * reading rows
   */
  async close(): Promise<void> {
    await this.envelopeReader.close();
    // this.envelopeReader = null;
    this.metadata = null;
  }
}

/**
 * The parquet envelope reader allows direct, unbuffered access to the individual
 * sections of the parquet file, namely the header, footer and the row groups.
 * This class is intended for advanced/internal users; if you just want to retrieve
 * rows from a parquet file use the ParquetReader instead
 */
export class ParquetEnvelopeReader {
  read: (position: number, length: number) => Promise<Buffer>;
  close: () => Promise<void>;
  fileSize: number;

  constructor(readFn, closeFn, fileSize) {
    this.read = readFn;
    this.close = closeFn;
    this.fileSize = fileSize;
  }

  async readHeader() {
    const buf = await this.read(0, PARQUET_MAGIC.length);
    if (buf.toString() !== PARQUET_MAGIC) {
      throw new Error(`parquet: invalid parquet file (magic "${buf.toString()}")`);
    }
  }

  async readRowGroup(schema, rowGroup, columnList) {
    const buffer = {
      rowCount: Number(rowGroup.num_rows),
      columnData: {}
    };

    for (const colChunk of rowGroup.columns) {
      const colMetadata = colChunk.meta_data;
      const colKey = colMetadata.path_in_schema;

      if (columnList.length > 0 && fieldIndexOf(columnList, colKey) < 0) {
        continue; // eslint-disable-line no-continue
      }

      buffer.columnData[colKey] = await this.readColumnChunk(schema, colChunk);
    }

    return buffer;
  }

  async readColumnChunk(schema, colChunk) {
    if (colChunk.file_path !== null) {
      throw new Error('parquet: external references are not supported');
    }

    const field = schema.findField(colChunk.meta_data.path_in_schema);
    if (!field) {
      throw new Error(`parquet: ${colChunk.meta_data.path_in_schema}`);
    }
    const type = getThriftEnum(parquetThrift.Type, colChunk.meta_data.type);

    const compression = getThriftEnum(parquetThrift.CompressionCodec, colChunk.meta_data.codec);

    const pagesOffset = Number(colChunk.meta_data.data_page_offset);
    const pagesSize = Number(colChunk.meta_data.total_compressed_size);
    const pagesBuf = await this.read(pagesOffset, pagesSize);

    return decodeDataPages(pagesBuf, {
      type,
      rLevelMax: field.rLevelMax,
      dLevelMax: field.dLevelMax,
      compression,
      column: field
    });
  }

  async readFooter() {
    const trailerLen = PARQUET_MAGIC.length + 4;
    const trailerBuf = await this.read(this.fileSize - trailerLen, trailerLen);

    if (trailerBuf.slice(4).toString() !== PARQUET_MAGIC) {
      throw new Error('parquet: not a valid parquet file');
    }

    const metadataSize = trailerBuf.readUInt32LE(0);
    const metadataOffset = this.fileSize - metadataSize - trailerLen;
    if (metadataOffset < PARQUET_MAGIC.length) {
      throw new Error('parquet: invalid metadata size');
    }

    const metadataBuf = await this.read(metadataOffset, metadataSize);
    const metadata = new parquetThrift.FileMetaData();
    decodeThrift(metadata, metadataBuf);
    return metadata;
  }
}

/**
 * Decode a consecutive array of data using one of the parquet encodings
 */
function decodeValues(type, encoding, cursor, count, opts) {
  if (!(encoding in PARQUET_CODECS)) {
    throw new Error(`parquet: invalid encoding: ${encoding}`);
  }
  return PARQUET_CODECS[encoding].decodeValues(type, cursor, count, opts);
}

function decodeDataPages(buffer, opts) {
  const cursor = {
    buffer,
    offset: 0,
    size: buffer.length
  };

  const data = {
    rlevels: [],
    dlevels: [],
    values: [],
    count: 0
  };

  while (cursor.offset < cursor.size) {
    const pageHeader = new parquetThrift.PageHeader();
    cursor.offset += decodeThrift(pageHeader, cursor.buffer);

    const pageType = getThriftEnum(parquetThrift.PageType, pageHeader.type);

    let pageData;
    switch (pageType) {
      case 'DATA_PAGE':
        pageData = decodeDataPage(cursor, pageHeader, opts);
        break;
      case 'DATA_PAGE_V2':
        pageData = decodeDataPageV2(cursor, pageHeader, opts);
        break;
      default:
        throw new Error(`parquet: invalid page type: ${pageType}`);
    }

    Array.prototype.push.apply(data.rlevels, pageData.rlevels);
    Array.prototype.push.apply(data.dlevels, pageData.dlevels);
    Array.prototype.push.apply(data.values, pageData.values);
    data.count += pageData.count;
  }

  return data;
}

function decodeDataPage(cursor, header, opts) {
  const valueCount = header.data_page_header.num_values;
  const valueEncoding = getThriftEnum(parquetThrift.Encoding, header.data_page_header.encoding);

  /* read repetition levels */
  const rLevelEncoding = getThriftEnum(
    parquetThrift.Encoding,
    header.data_page_header.repetition_level_encoding
  );

  let rLevels = new Array(valueCount);
  if (opts.rLevelMax > 0) {
    rLevels = decodeValues(PARQUET_RDLVL_TYPE, rLevelEncoding, cursor, valueCount, {
      bitWidth: getBitWidth(opts.rLevelMax)
    });
  } else {
    rLevels.fill(0);
  }

  /* read definition levels */
  const dLevelEncoding = getThriftEnum(
    parquetThrift.Encoding,
    header.data_page_header.definition_level_encoding
  );

  let dLevels = new Array(valueCount);
  if (opts.dLevelMax > 0) {
    dLevels = decodeValues(PARQUET_RDLVL_TYPE, dLevelEncoding, cursor, valueCount, {
      bitWidth: getBitWidth(opts.dLevelMax)
    });
  } else {
    dLevels.fill(0);
  }

  /* read values */
  let valueCountNonNull = 0;
  for (const dlvl of dLevels) {
    if (dlvl === opts.dLevelMax) {
      ++valueCountNonNull;
    }
  }

  const values = decodeValues(opts.type, valueEncoding, cursor, valueCountNonNull, {
    typeLength: opts.column.typeLength,
    bitWidth: opts.column.typeLength
  });

  return {
    dlevels: dLevels,
    rlevels: rLevels,
    values,
    count: valueCount
  };
}

function decodeDataPageV2(cursor, header, opts) {
  const cursorEnd = cursor.offset + header.compressed_page_size;

  const valueCount = header.data_page_header_v2.num_values;
  const valueCountNonNull = valueCount - header.data_page_header_v2.num_nulls;
  const valueEncoding = getThriftEnum(parquetThrift.Encoding, header.data_page_header_v2.encoding);

  /* read repetition levels */
  let rLevels = new Array(valueCount);
  if (opts.rLevelMax > 0) {
    rLevels = decodeValues(PARQUET_RDLVL_TYPE, PARQUET_RDLVL_ENCODING, cursor, valueCount, {
      bitWidth: getBitWidth(opts.rLevelMax),
      disableEnvelope: true
    });
  } else {
    rLevels.fill(0);
  }

  /* read definition levels */
  let dLevels = new Array(valueCount);
  if (opts.dLevelMax > 0) {
    dLevels = decodeValues(PARQUET_RDLVL_TYPE, PARQUET_RDLVL_ENCODING, cursor, valueCount, {
      bitWidth: getBitWidth(opts.dLevelMax),
      disableEnvelope: true
    });
  } else {
    dLevels.fill(0);
  }

  /* read values */
  let valuesBufCursor = cursor;

  if (header.data_page_header_v2.is_compressed) {
    const valuesBuf = inflate(opts.compression, cursor.buffer.slice(cursor.offset, cursorEnd));

    valuesBufCursor = {
      buffer: valuesBuf,
      offset: 0,
      size: valuesBuf.length
    };

    cursor.offset = cursorEnd;
  }

  const values = decodeValues(opts.type, valueEncoding, valuesBufCursor, valueCountNonNull, {
    typeLength: opts.column.typeLength,
    bitWidth: opts.column.typeLength
  });

  return {
    dlevels: dLevels,
    rlevels: rLevels,
    values,
    count: valueCount
  };
}

function decodeSchema(schemaElements) {
  const schema = {};
  for (let idx = 0; idx < schemaElements.length; ) {
    const schemaElement = schemaElements[idx];

    const repetitionType = getThriftEnum(
      parquetThrift.FieldRepetitionType,
      schemaElement.repetition_type
    );

    let optional = false;
    let repeated = false;
    switch (repetitionType) {
      case 'REQUIRED':
        break;
      case 'OPTIONAL':
        optional = true;
        break;
      case 'REPEATED':
        repeated = true;
        break;
      default:
        throw new Error(repetitionType);
    }

    if (schemaElement.num_children > 0) {
      schema[schemaElement.name] = {
        optional,
        repeated,
        fields: decodeSchema(schemaElements.slice(idx + 1, idx + 1 + schemaElement.num_children))
      };
    } else {
      let logicalType = getThriftEnum(parquetThrift.Type, schemaElement.type);

      if (schemaElement.converted_type !== null) {
        logicalType = getThriftEnum(parquetThrift.ConvertedType, schemaElement.converted_type);
      }

      schema[schemaElement.name] = {
        type: logicalType,
        typeLength: schemaElement.type_length,
        optional,
        repeated
      };
    }

    idx += (schemaElement.num_children || 0) + 1;
  }

  return schema;
}
