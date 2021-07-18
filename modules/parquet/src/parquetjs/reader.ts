// Forked from https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.)
import {CursorBuffer, ParquetCodecOptions, PARQUET_CODECS} from './codecs';
import * as Compression from './compression';
import {
  ParquetBuffer,
  ParquetCodec,
  ParquetCompression,
  ParquetData,
  ParquetField,
  ParquetRecord,
  ParquetType,
  PrimitiveType,
  SchemaDefinition
} from './schema/declare';
import {ParquetSchema} from './schema/schema';
import * as Shred from './schema/shred';
// tslint:disable-next-line:max-line-length
import {
  ColumnChunk,
  CompressionCodec,
  ConvertedType,
  Encoding,
  FieldRepetitionType,
  FileMetaData,
  PageHeader,
  PageType,
  RowGroup,
  SchemaElement,
  Type
} from './parquet-thrift';
import * as Util from './util';
// import Fs = require('fs');

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
export class ParquetCursor<T> implements AsyncIterable<T> {
  public metadata: FileMetaData;
  public envelopeReader: ParquetEnvelopeReader;
  public schema: ParquetSchema;
  public columnList: string[][];
  public rowGroup: ParquetRecord[];
  public rowGroupIndex: number;

  /**
   * Create a new parquet reader from the file metadata and an envelope reader.
   * It is usually not recommended to call this constructor directly except for
   * advanced and internal use cases. Consider using getCursor() on the
   * ParquetReader instead
   */
  constructor(
    metadata: FileMetaData,
    envelopeReader: ParquetEnvelopeReader,
    schema: ParquetSchema,
    columnList: string[][]
  ) {
    this.metadata = metadata;
    this.envelopeReader = envelopeReader;
    this.schema = schema;
    this.columnList = columnList;
    this.rowGroup = [];
    this.rowGroupIndex = 0;
  }

  /**
   * Retrieve the next row from the cursor. Returns a row or NULL if the end
   * of the file was reached
   */
  async next<T = any>(): Promise<T> {
    if (this.rowGroup.length === 0) {
      if (this.rowGroupIndex >= this.metadata.row_groups.length) {
        // @ts-ignore
        return null;
      }
      const rowBuffer = await this.envelopeReader.readRowGroup(
        this.schema,
        this.metadata.row_groups[this.rowGroupIndex],
        this.columnList
      );
      this.rowGroup = Shred.materializeRecords(this.schema, rowBuffer);
      this.rowGroupIndex++;
    }
    return this.rowGroup.shift() as any;
  }

  /**
   * Rewind the cursor the the beginning of the file
   */
  rewind(): void {
    this.rowGroup = [];
    this.rowGroupIndex = 0;
  }

  /**
   * Implement AsyncIterable
   */
  // tslint:disable-next-line:function-name
  [Symbol.asyncIterator](): AsyncIterator<T> {
    let done = false;
    return {
      next: async () => {
        if (done) {
          return {done, value: null};
        }
        const value = await this.next();
        if (value === null) {
          return {done: true, value};
        }
        return {done: false, value};
      },
      return: async () => {
        done = true;
        return {done, value: null};
      },
      throw: async () => {
        done = true;
        return {done: true, value: null};
      }
    };
  }
}

/**
 * A parquet reader allows retrieving the rows from a parquet file in order.
 * The basic usage is to create a reader and then retrieve a cursor/iterator
 * which allows you to consume row after row until all rows have been read. It is
 * important that you call close() after you are finished reading the file to
 * avoid leaking file descriptors.
 */
export class ParquetReader<T> implements AsyncIterable<T> {
  /**
   * return a new parquet reader initialized with a read function
   */
  static async openBlob<T>(blob: Blob): Promise<ParquetReader<T>> {
    const readFn = async (start: number, length: number) => {
      const arrayBuffer = await blob.slice(start, start + length).arrayBuffer();
      return Buffer.from(arrayBuffer);
    };
    const closeFn = async () => {};
    const size = blob.size;
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
   * return a new parquet reader initialized with a read function
   */
  static async openArrayBuffer<T>(arrayBuffer: ArrayBuffer): Promise<ParquetReader<T>> {
    const readFn = async (start: number, length: number) => Buffer.from(arrayBuffer, start, length);
    const closeFn = async () => {};
    const size = arrayBuffer.byteLength;
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
   * Open the parquet file pointed to by the specified path and return a new
   * parquet reader
   */
  static async openFile<T>(filePath: string): Promise<ParquetReader<T>> {
    const envelopeReader = await ParquetEnvelopeReader.openFile(filePath);
    try {
      await envelopeReader.readHeader();
      const metadata = await envelopeReader.readFooter();
      return new ParquetReader<T>(metadata, envelopeReader);
    } catch (err) {
      await envelopeReader.close();
      throw err;
    }
  }

  static async openBuffer<T>(buffer: Buffer): Promise<ParquetReader<T>> {
    const envelopeReader = await ParquetEnvelopeReader.openBuffer(buffer);
    try {
      await envelopeReader.readHeader();
      const metadata = await envelopeReader.readFooter();
      return new ParquetReader<T>(metadata, envelopeReader);
    } catch (err) {
      await envelopeReader.close();
      throw err;
    }
  }

  public metadata: FileMetaData;
  public envelopeReader: ParquetEnvelopeReader;
  public schema: ParquetSchema;

  /**
   * Create a new parquet reader from the file metadata and an envelope reader.
   * It is not recommended to call this constructor directly except for advanced
   * and internal use cases. Consider using one of the open{File,Buffer} methods
   * instead
   */
  constructor(metadata: FileMetaData, envelopeReader: ParquetEnvelopeReader) {
    if (metadata.version !== PARQUET_VERSION) {
      throw new Error('invalid parquet version');
    }

    this.metadata = metadata;
    this.envelopeReader = envelopeReader;
    const root = this.metadata.schema[0];
    const {schema} = decodeSchema(this.metadata.schema, 1, root.num_children!);
    this.schema = new ParquetSchema(schema);
  }

  /**
   * Close this parquet reader. You MUST call this method once you're finished
   * reading rows
   */
  async close(): Promise<void> {
    await this.envelopeReader.close();
    // this.envelopeReader = null;
    // this.metadata = null;
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
  getCursor(): ParquetCursor<T>;
  // @ts-ignore
  getCursor<K extends keyof T>(columnList: (K | K[])[]): ParquetCursor<Pick<T, K>>;
  getCursor(columnList: (string | string[])[]): ParquetCursor<Partial<T>>;
  getCursor(columnList?: (string | string[])[]): ParquetCursor<Partial<T>> {
    if (!columnList) {
      // tslint:disable-next-line:no-parameter-reassignment
      columnList = [];
    }

    // tslint:disable-next-line:no-parameter-reassignment
    columnList = columnList.map((x) => (Array.isArray(x) ? x : [x]));

    return new ParquetCursor<T>(
      this.metadata,
      this.envelopeReader,
      this.schema,
      columnList as string[][]
    );
  }

  /**
   * Return the number of rows in this file. Note that the number of rows is
   * not neccessarily equal to the number of rows in each column.
   */
  getRowCount(): number {
    return Number(this.metadata.num_rows);
  }

  /**
   * Returns the ParquetSchema for this file
   */
  getSchema(): ParquetSchema {
    return this.schema;
  }

  /**
   * Returns the user (key/value) metadata for this file
   */
  getMetadata(): Record<string, string> {
    const md: Record<string, string> = {};
    for (const kv of this.metadata.key_value_metadata!) {
      md[kv.key] = kv.value!;
    }
    return md;
  }

  /**
   * Implement AsyncIterable
   */
  // tslint:disable-next-line:function-name
  [Symbol.asyncIterator](): AsyncIterator<T> {
    return this.getCursor()[Symbol.asyncIterator]();
  }
}

/**
 * The parquet envelope reader allows direct, unbuffered access to the individual
 * sections of the parquet file, namely the header, footer and the row groups.
 * This class is intended for advanced/internal users; if you just want to retrieve
 * rows from a parquet file use the ParquetReader instead
 */
export class ParquetEnvelopeReader {
  public read: (position: number, length: number) => Promise<Buffer>;
  /**
   * Close this parquet reader. You MUST call this method once you're finished
   * reading rows
   */
  public close: () => Promise<void>;
  public fileSize: number;

  static async openFile(filePath: string): Promise<ParquetEnvelopeReader> {
    const fileStat = await Util.fstat(filePath);
    const fileDescriptor = await Util.fopen(filePath);

    const readFn = Util.fread.bind(undefined, fileDescriptor);
    const closeFn = Util.fclose.bind(undefined, fileDescriptor);

    return new ParquetEnvelopeReader(readFn, closeFn, fileStat.size);
  }

  static async openBuffer(buffer: Buffer): Promise<ParquetEnvelopeReader> {
    const readFn = (position: number, length: number) =>
      Promise.resolve(buffer.slice(position, position + length));
    const closeFn = () => Promise.resolve();
    return new ParquetEnvelopeReader(readFn, closeFn, buffer.length);
  }

  constructor(
    read: (position: number, length: number) => Promise<Buffer>,
    close: () => Promise<void>,
    fileSize: number
  ) {
    this.read = read;
    this.close = close;
    this.fileSize = fileSize;
  }

  async readHeader(): Promise<void> {
    const buf = await this.read(0, PARQUET_MAGIC.length);

    if (buf.toString() !== PARQUET_MAGIC) {
      throw new Error('not valid parquet file');
    }
  }

  async readRowGroup(
    schema: ParquetSchema,
    rowGroup: RowGroup,
    columnList: string[][]
  ): Promise<ParquetBuffer> {
    const buffer: ParquetBuffer = {
      rowCount: Number(rowGroup.num_rows),
      columnData: {}
    };
    for (const colChunk of rowGroup.columns) {
      const colMetadata = colChunk.meta_data;
      const colKey = colMetadata?.path_in_schema;
      if (columnList.length > 0 && Util.fieldIndexOf(columnList, colKey!) < 0) {
        continue; // eslint-disable-line no-continue
      }
      buffer.columnData[colKey!.join()] = await this.readColumnChunk(schema, colChunk);
    }
    return buffer;
  }

  async readColumnChunk(schema: ParquetSchema, colChunk: ColumnChunk): Promise<ParquetData> {
    if (colChunk.file_path !== undefined && colChunk.file_path !== null) {
      throw new Error('external references are not supported');
    }

    const field = schema.findField(colChunk.meta_data?.path_in_schema!);
    const type: PrimitiveType = Util.getThriftEnum(Type, colChunk.meta_data?.type!) as any;
    if (type !== field.primitiveType) throw new Error(`chunk type not matching schema: ${type}`);

    const compression: ParquetCompression = Util.getThriftEnum(
      CompressionCodec,
      colChunk.meta_data?.codec!
    ) as any;

    const pagesOffset = Number(colChunk.meta_data?.data_page_offset!);
    const pagesSize = Number(colChunk.meta_data?.total_compressed_size!);
    const pagesBuf = await this.read(pagesOffset, pagesSize);

    return decodeDataPages(pagesBuf, field, compression);
  }

  async readFooter(): Promise<FileMetaData> {
    const trailerLen = PARQUET_MAGIC.length + 4;
    const trailerBuf = await this.read(this.fileSize - trailerLen, trailerLen);

    if (trailerBuf.slice(4).toString() !== PARQUET_MAGIC) {
      throw new Error('not a valid parquet file');
    }

    const metadataSize = trailerBuf.readUInt32LE(0);
    const metadataOffset = this.fileSize - metadataSize - trailerLen;
    if (metadataOffset < PARQUET_MAGIC.length) {
      throw new Error('invalid metadata size');
    }

    const metadataBuf = await this.read(metadataOffset, metadataSize);
    // let metadata = new parquet_thrift.FileMetaData();
    // parquet_util.decodeThrift(metadata, metadataBuf);
    const {metadata} = Util.decodeFileMetadata(metadataBuf);
    return metadata;
  }
}

/**
 * Decode a consecutive array of data using one of the parquet encodings
 */
function decodeValues(
  type: PrimitiveType,
  encoding: ParquetCodec,
  cursor: CursorBuffer,
  count: number,
  opts: ParquetCodecOptions
): any[] {
  if (!(encoding in PARQUET_CODECS)) {
    throw new Error(`invalid encoding: ${encoding}`);
  }
  return PARQUET_CODECS[encoding].decodeValues(type, cursor, count, opts);
}

function decodeDataPages(
  buffer: Buffer,
  column: ParquetField,
  compression: ParquetCompression
): ParquetData {
  const cursor: CursorBuffer = {
    buffer,
    offset: 0,
    size: buffer.length
  };

  const data: ParquetData = {
    rlevels: [],
    dlevels: [],
    values: [],
    count: 0
  };

  // @ts-ignore size can be undefined
  while (cursor.offset < cursor.size) {
    // const pageHeader = new parquet_thrift.PageHeader();
    // cursor.offset += parquet_util.decodeThrift(pageHeader, cursor.buffer);

    const {pageHeader, length} = Util.decodePageHeader(cursor.buffer);
    cursor.offset += length;

    const pageType = Util.getThriftEnum(PageType, pageHeader.type);

    let pageData: ParquetData | null = null;
    switch (pageType) {
      case 'DATA_PAGE':
        pageData = decodeDataPage(cursor, pageHeader, column, compression);
        break;
      case 'DATA_PAGE_V2':
        pageData = decodeDataPageV2(cursor, pageHeader, column, compression);
        break;
      default:
        throw new Error(`invalid page type: ${pageType}`);
    }

    Array.prototype.push.apply(data.rlevels, pageData.rlevels);
    Array.prototype.push.apply(data.dlevels, pageData.dlevels);
    Array.prototype.push.apply(data.values, pageData.values);
    data.count += pageData.count;
  }

  return data;
}

function decodeDataPage(
  cursor: CursorBuffer,
  header: PageHeader,
  column: ParquetField,
  compression: ParquetCompression
): ParquetData {
  const cursorEnd = cursor.offset + header.compressed_page_size;
  const valueCount = header.data_page_header?.num_values;

  // const info = {
  //   path: opts.column.path.join('.'),
  //   valueEncoding,
  //   dLevelEncoding,
  //   rLevelEncoding,
  //   cursorOffset: cursor.offset,
  //   cursorEnd,
  //   cusrorSize: cursor.size,
  //   header,
  //   opts,
  //   buffer: cursor.buffer.toJSON(),
  //   values: null as any[],
  //   valBuf: null as any
  // };
  // Fs.writeFileSync(`dump/${info.path}.ts.json`, JSON.stringify(info, null, 2));

  /* uncompress page */
  let dataCursor = cursor;
  if (compression !== 'UNCOMPRESSED') {
    const valuesBuf = Compression.inflate(
      compression,
      cursor.buffer.slice(cursor.offset, cursorEnd),
      header.uncompressed_page_size
    );
    dataCursor = {
      buffer: valuesBuf,
      offset: 0,
      size: valuesBuf.length
    };
    cursor.offset = cursorEnd;
  }

  /* read repetition levels */
  const rLevelEncoding = Util.getThriftEnum(
    Encoding,
    header.data_page_header?.repetition_level_encoding!
  ) as ParquetCodec;
  // tslint:disable-next-line:prefer-array-literal
  let rLevels = new Array(valueCount);
  if (column.rLevelMax > 0) {
    rLevels = decodeValues(PARQUET_RDLVL_TYPE, rLevelEncoding, dataCursor, valueCount!, {
      bitWidth: Util.getBitWidth(column.rLevelMax),
      disableEnvelope: false
      // column: opts.column
    });
  } else {
    rLevels.fill(0);
  }

  /* read definition levels */
  const dLevelEncoding = Util.getThriftEnum(
    Encoding,
    header.data_page_header?.definition_level_encoding!
  ) as ParquetCodec;
  // tslint:disable-next-line:prefer-array-literal
  let dLevels = new Array(valueCount);
  if (column.dLevelMax > 0) {
    dLevels = decodeValues(PARQUET_RDLVL_TYPE, dLevelEncoding, dataCursor, valueCount!, {
      bitWidth: Util.getBitWidth(column.dLevelMax),
      disableEnvelope: false
      // column: opts.column
    });
  } else {
    dLevels.fill(0);
  }
  let valueCountNonNull = 0;
  for (const dlvl of dLevels) {
    if (dlvl === column.dLevelMax) {
      valueCountNonNull++;
    }
  }

  /* read values */
  const valueEncoding = Util.getThriftEnum(
    Encoding,
    header.data_page_header?.encoding!
  ) as ParquetCodec;
  const values = decodeValues(column.primitiveType!, valueEncoding, dataCursor, valueCountNonNull, {
    typeLength: column.typeLength,
    bitWidth: column.typeLength
  });

  // info.valBuf = uncursor.buffer.toJSON();
  // info.values = values;
  // Fs.writeFileSync(`dump/${info.path}.ts.json`, JSON.stringify(info, null, 2));

  return {
    dlevels: dLevels,
    rlevels: rLevels,
    values,
    count: valueCount!
  };
}

function decodeDataPageV2(
  cursor: CursorBuffer,
  header: PageHeader,
  column: ParquetField,
  compression: ParquetCompression
): ParquetData {
  const cursorEnd = cursor.offset + header.compressed_page_size;

  const valueCount = header.data_page_header_v2?.num_values;
  // @ts-ignore
  const valueCountNonNull = valueCount - header.data_page_header_v2?.num_nulls;
  const valueEncoding = Util.getThriftEnum(
    Encoding,
    header.data_page_header_v2?.encoding!
  ) as ParquetCodec;

  /* read repetition levels */
  // tslint:disable-next-line:prefer-array-literal
  let rLevels = new Array(valueCount);
  if (column.rLevelMax > 0) {
    rLevels = decodeValues(PARQUET_RDLVL_TYPE, PARQUET_RDLVL_ENCODING, cursor, valueCount!, {
      bitWidth: Util.getBitWidth(column.rLevelMax),
      disableEnvelope: true
    });
  } else {
    rLevels.fill(0);
  }

  /* read definition levels */
  // tslint:disable-next-line:prefer-array-literal
  let dLevels = new Array(valueCount);
  if (column.dLevelMax > 0) {
    dLevels = decodeValues(PARQUET_RDLVL_TYPE, PARQUET_RDLVL_ENCODING, cursor, valueCount!, {
      bitWidth: Util.getBitWidth(column.dLevelMax),
      disableEnvelope: true
    });
  } else {
    dLevels.fill(0);
  }

  /* read values */
  let valuesBufCursor = cursor;

  if (header.data_page_header_v2?.is_compressed) {
    const valuesBuf = Compression.inflate(
      compression,
      cursor.buffer.slice(cursor.offset, cursorEnd),
      header.uncompressed_page_size
    );

    valuesBufCursor = {
      buffer: valuesBuf,
      offset: 0,
      size: valuesBuf.length
    };

    cursor.offset = cursorEnd;
  }

  const values = decodeValues(
    column.primitiveType!,
    valueEncoding,
    valuesBufCursor,
    valueCountNonNull,
    {
      typeLength: column.typeLength,
      bitWidth: column.typeLength
    }
  );

  return {
    dlevels: dLevels,
    rlevels: rLevels,
    values,
    count: valueCount!
  };
}

function decodeSchema(
  schemaElements: SchemaElement[],
  offset: number,
  len: number
): {
  offset: number;
  next: number;
  schema: SchemaDefinition;
} {
  const schema: SchemaDefinition = {};
  let next = offset;
  for (let i = 0; i < len; i++) {
    const schemaElement = schemaElements[next];

    const repetitionType =
      next > 0 ? Util.getThriftEnum(FieldRepetitionType, schemaElement.repetition_type!) : 'ROOT';

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
        throw new Error('parquet: unknown repetition type');
    }

    if (schemaElement.num_children! > 0) {
      const res = decodeSchema(schemaElements, next + 1, schemaElement.num_children!);
      next = res.next;
      schema[schemaElement.name] = {
        // type: undefined,
        optional,
        repeated,
        fields: res.schema
      };
    } else {
      let logicalType = Util.getThriftEnum(Type, schemaElement.type!);

      if (schemaElement.converted_type) {
        logicalType = Util.getThriftEnum(ConvertedType, schemaElement.converted_type);
      }

      schema[schemaElement.name] = {
        type: logicalType as ParquetType,
        typeLength: schemaElement.type_length,
        optional,
        repeated
      };
      next++;
    }
  }
  return {schema, offset, next};
}
