// Forked from https://github.com/ironSource/parquetjs under MIT license
/* eslint-disable camelcase */
import type {ParquetSchema} from './schema/schema';
import type {ShreddedRecord} from './schema/shred';
import stream from 'stream';
import {Mutex} from 'async-mutex';
import parquetThrift from '../libs/parquet-types';
import {shredRecord} from './schema/shred';
import {serializeThrift, getBitWidth} from './util';
import {osopen, oswrite, osclose} from './file';
import {PARQUET_CODECS} from './codecs';
import {deflate} from './compression';

/**
 * Parquet File Magic String
 */
const PARQUET_MAGIC = 'PAR1';

/**
 * Parquet File Format Version
 */
const PARQUET_VERSION = 1;

/**
 * Default Page and Row Group sizes
 */
const PARQUET_DEFAULT_PAGE_SIZE = 8192;
const PARQUET_DEFAULT_ROW_GROUP_SIZE = 4096;

/**
 * Repetition and Definition Level Encoding
 */
const PARQUET_RDLVL_TYPE = 'INT32';
const PARQUET_RDLVL_ENCODING = 'RLE';

/**
 * Write a parquet file to an output stream. The ParquetWriter will perform
 * buffering/batching for performance, so close() must be called after all rows
 * are written.
 */
export class ParquetWriter {
  schema: ParquetSchema;
  envelopeWriter: ParquetEnvelopeWriter;

  rowBuffer: ShreddedRecord = {} as ShreddedRecord;
  rowGroupSize = PARQUET_DEFAULT_ROW_GROUP_SIZE;
  closed = false;
  userMetadata = {};
  writeMutex = new Mutex();

  /**
   * Convenience method to create a new buffered parquet writer that writes to
   * the specified file
   */
  static async openFile(schema, path, opts) {
    const outputStream = await osopen(path, opts);
    return ParquetWriter.openStream(schema, outputStream, opts);
  }

  /**
   * Convenience method to create a new buffered parquet writer that writes to
   * the specified stream
   */
  static async openStream(schema, outputStream, opts) {
    if (!opts) {
      opts = {};
    }

    const envelopeWriter = await ParquetEnvelopeWriter.openStream(schema, outputStream, opts);

    return new ParquetWriter(schema, envelopeWriter, opts);
  }

  // writer

  /**
   * Create a new buffered parquet writer for a given envelope writer
   */
  constructor(schema, envelopeWriter, opts) {
    this.schema = schema;
    this.envelopeWriter = envelopeWriter;
    this.rowGroupSize = opts.rowGroupSize || PARQUET_DEFAULT_ROW_GROUP_SIZE;

    try {
      envelopeWriter.writeHeader();
    } catch (err) {
      envelopeWriter.close();
      throw err;
    }
  }

  /**
   * Append a single row to the parquet file. Rows are buffered in memory until
   * rowGroupSize rows are in the buffer or close() is called
   */
  async appendRow(row) {
    if (this.closed) {
      throw new Error('writer was closed');
    }

    const release = await this.writeMutex.acquire();

    try {
      shredRecord(this.schema, row, this.rowBuffer);

      if (this.rowBuffer.rowCount >= this.rowGroupSize) {
        await this.envelopeWriter.writeRowGroup(this.rowBuffer);
        this.rowBuffer = {} as ShreddedRecord;
      }
    } finally {
      release();
    }
  }

  /**
   * Finish writing the parquet file and commit the footer to disk. This method
   * MUST be called after you are finished adding rows. You must not call this
   * method twice on the same object or add any rows after the close() method has
   * been called
   */
  async close(done?: () => any) {
    if (this.closed) {
      throw new Error('writer was closed');
    }

    this.closed = true;

    const release = await this.writeMutex.acquire();

    try {
      if (this.rowBuffer.rowCount > 0) {
        await this.envelopeWriter.writeRowGroup(this.rowBuffer);
        this.rowBuffer = {} as ShreddedRecord;
      }

      await this.envelopeWriter.writeFooter(this.userMetadata);
      await this.envelopeWriter.close();
      // this.envelopeWriter = null;

      if (done) {
        done(); // eslint-disable-line callback-return
      }
    } finally {
      release();
    }
  }

  /**
   * Add key<>value metadata to the file
   */
  setMetadata(key, value) {
    this.userMetadata[key.toString()] = value.toString();
  }

  /**
   * Set the parquet row group size. This values controls the maximum number
   * of rows that are buffered in memory at any given time as well as the number
   * of rows that are co-located on disk. A higher value is generally better for
   * read-time I/O performance at the tradeoff of write-time memory usage.
   */
  setRowGroupSize(cnt) {
    this.rowGroupSize = cnt;
  }

  /**
   * Set the parquet data page size. The data page size controls the maximum
   * number of column values that are written to disk as a consecutive array
   */
  setPageSize(cnt) {
    this.envelopeWriter.setPageSize(cnt);
  }
}

/**
 * Create a parquet file from a schema and a number of row groups. This class
 * performs direct, unbuffered writes to the underlying output stream and is
 * intended for advanced and internal users; the writeXXX methods must be
 * called in the correct order to produce a valid file.
 */
export class ParquetEnvelopeWriter {
  schema: ParquetSchema;
  write;
  close;
  offset: number;
  rowCount = 0;
  rowGroups: any[] = [];
  pageSize = PARQUET_DEFAULT_PAGE_SIZE;
  useDataPageV2: boolean;

  /**
   * Create a new parquet envelope writer that writes to the specified stream
   */
  static async openStream(schema, outputStream, opts) {
    const writeFn = oswrite.bind(undefined, outputStream);
    const closeFn = osclose.bind(undefined, outputStream);
    return new ParquetEnvelopeWriter(schema, writeFn, closeFn, 0, opts);
  }

  constructor(schema, writeFn, closeFn, fileOffset, opts) {
    this.schema = schema;
    this.write = writeFn;
    this.close = closeFn;
    this.offset = fileOffset;
    this.useDataPageV2 = 'useDataPageV2' in opts ? opts.useDataPageV2 : true;
  }

  async writeSection(buf): Promise<void> {
    this.offset += buf.length;
    this.write(buf);
  }

  /**
   * Encode the parquet file header
   */
  async writeHeader(): Promise<void> {
    await this.writeSection(Buffer.from(PARQUET_MAGIC));
  }

  /**
   * Encode a parquet row group. The records object should be created using the
   * shredRecord method
   */
  async writeRowGroup(records): Promise<void> {
    const rgroup = encodeRowGroup(this.schema, records, {
      baseOffset: this.offset,
      pageSize: this.pageSize,
      useDataPageV2: this.useDataPageV2
    });

    this.rowCount += records.rowCount;
    this.rowGroups.push(rgroup.metadata);
    await this.writeSection(rgroup.body);
  }

  /**
   * Write the parquet file footer
   */
  async writeFooter(userMetadata): Promise<void> {
    if (!userMetadata) {
      userMetadata = {};
    }

    if (this.schema.fieldList.length === 0) {
      throw new Error('cannot write parquet file with zero fieldList');
    }

    return this.writeSection(
      encodeFooter(this.schema, this.rowCount, this.rowGroups, userMetadata)
    );
  }

  /**
   * Set the parquet data page size. The data page size controls the maximum
   * number of column values that are written to disk as a consecutive array
   */
  setPageSize(cnt) {
    this.pageSize = cnt;
  }
}

/**
 * Create a parquet transform stream
 */
export class ParquetTransformer extends stream.Transform {
  writer: ParquetWriter;

  constructor(schema, opts = {}) {
    super({objectMode: true});

    const writeProxy = (function (t) {
      return function (b) {
        t.push(b);
      };
    })(this);

    this.writer = new ParquetWriter(
      schema,
      new ParquetEnvelopeWriter(schema, writeProxy, () => {}, 0, opts),
      opts
    );
  }

  _transform(row, encoding, done) {
    if (row) {
      this.writer.appendRow(row).then((d) => done(null, d), done);
    } else {
      done(); // eslint-disable-line callback-return
    }
  }

  _flush(done) {
    this.writer.close(done).then((d) => done(null, d), done);
  }
}

/**
 * Encode a consecutive array of data using one of the parquet encodings
 */
function encodeValues(type, encoding, values, opts) {
  if (!(encoding in PARQUET_CODECS)) {
    throw new Error(`invalid encoding: ${encoding}`);
  }

  return PARQUET_CODECS[encoding].encodeValues(type, values, opts);
}

/**
 * Encode a parquet data page
 */
function encodeDataPage(column, valueCount, values, rlevels, dlevels) {
  /* encode values */
  const valuesBuf = encodeValues(column.primitiveType, column.encoding, values, {
    typeLength: column.typeLength,
    bitWidth: column.typeLength
  });

  /* encode repetition and definition levels */
  let rLevelsBuf = Buffer.alloc(0);
  if (column.rLevelMax > 0) {
    rLevelsBuf = encodeValues(PARQUET_RDLVL_TYPE, PARQUET_RDLVL_ENCODING, rlevels, {
      bitWidth: getBitWidth(column.rLevelMax)
    });
  }

  let dLevelsBuf = Buffer.alloc(0);
  if (column.dLevelMax > 0) {
    dLevelsBuf = encodeValues(PARQUET_RDLVL_TYPE, PARQUET_RDLVL_ENCODING, dlevels, {
      bitWidth: getBitWidth(column.dLevelMax)
    });
  }

  /* build page header */
  const pageBody = Buffer.concat([rLevelsBuf, dLevelsBuf, valuesBuf]);
  const pageHeader = new parquetThrift.PageHeader();
  pageHeader.type = parquetThrift.PageType.DATA_PAGE;
  pageHeader.uncompressed_page_size = pageBody.length;
  pageHeader.compressed_page_size = pageBody.length;
  pageHeader.data_page_header = new parquetThrift.DataPageHeader();
  pageHeader.data_page_header.num_values = valueCount;

  pageHeader.data_page_header.encoding = parquetThrift.Encoding[column.encoding];
  pageHeader.data_page_header.definition_level_encoding =
    parquetThrift.Encoding[PARQUET_RDLVL_ENCODING];
  pageHeader.data_page_header.repetition_level_encoding =
    parquetThrift.Encoding[PARQUET_RDLVL_ENCODING];

  /* concat page header, repetition and definition levels and values */
  return Buffer.concat([serializeThrift(pageHeader), pageBody]);
}

/**
 * Encode a parquet data page (v2)
 */
// eslint-disable-next-line max-params
function encodeDataPageV2(column, valueCount, rowCount, values, rlevels, dlevels) {
  /* encode values */
  const valuesBuf = encodeValues(column.primitiveType, column.encoding, values, {
    typeLength: column.typeLength,
    bitWidth: column.typeLength
  });

  const valuesBufCompressed = deflate(column.compression, valuesBuf);

  /* encode repetition and definition levels */
  let rLevelsBuf = Buffer.alloc(0);
  if (column.rLevelMax > 0) {
    rLevelsBuf = encodeValues(PARQUET_RDLVL_TYPE, PARQUET_RDLVL_ENCODING, rlevels, {
      bitWidth: getBitWidth(column.rLevelMax),
      disableEnvelope: true
    });
  }

  let dLevelsBuf = Buffer.alloc(0);
  if (column.dLevelMax > 0) {
    dLevelsBuf = encodeValues(PARQUET_RDLVL_TYPE, PARQUET_RDLVL_ENCODING, dlevels, {
      bitWidth: getBitWidth(column.dLevelMax),
      disableEnvelope: true
    });
  }

  /* build page header */
  const pageHeader = new parquetThrift.PageHeader();
  pageHeader.type = parquetThrift.PageType.DATA_PAGE_V2;
  pageHeader.data_page_header_v2 = new parquetThrift.DataPageHeaderV2();
  pageHeader.data_page_header_v2.num_values = valueCount;
  pageHeader.data_page_header_v2.num_nulls = valueCount - values.length;
  pageHeader.data_page_header_v2.num_rows = rowCount;

  pageHeader.uncompressed_page_size = rLevelsBuf.length + dLevelsBuf.length + valuesBuf.length;

  pageHeader.compressed_page_size =
    rLevelsBuf.length + dLevelsBuf.length + valuesBufCompressed.length;

  pageHeader.data_page_header_v2.encoding = parquetThrift.Encoding[column.encoding];
  pageHeader.data_page_header_v2.definition_levels_byte_length = dLevelsBuf.length;
  pageHeader.data_page_header_v2.repetition_levels_byte_length = rLevelsBuf.length;

  pageHeader.data_page_header_v2.is_compressed = column.compression !== 'UNCOMPRESSED';

  /* concat page header, repetition and definition levels and values */
  return Buffer.concat([serializeThrift(pageHeader), rLevelsBuf, dLevelsBuf, valuesBufCompressed]);
}

/**
 * Encode an array of values into a parquet column chunk
 */
function encodeColumnChunk(values, opts) {
  /* encode data page(s) */
  const pages: Buffer[] = [];

  {
    let dataPage;
    if (opts.useDataPageV2) {
      dataPage = encodeDataPageV2(
        opts.column,
        values.count,
        opts.rowCount,
        values.values,
        values.rlevels,
        values.dlevels
      );
    } else {
      dataPage = encodeDataPage(
        opts.column,
        values.count,
        values.values,
        values.rlevels,
        values.dlevels
      );
    }

    pages.push(dataPage);
  }

  const pagesBuf = Buffer.concat(pages);

  /* prepare metadata header */
  const metadata = new parquetThrift.ColumnMetaData();
  metadata.path_in_schema = opts.column.path;
  metadata.num_values = values.count;
  metadata.data_page_offset = opts.baseOffset;
  metadata.encodings = [];
  metadata.total_uncompressed_size = pagesBuf.length;
  metadata.total_compressed_size = pagesBuf.length;

  metadata.type = parquetThrift.Type[opts.column.primitiveType];
  metadata.codec =
    parquetThrift.CompressionCodec[opts.useDataPageV2 ? opts.column.compression : 'UNCOMPRESSED'];

  /* list encodings */
  const encodingsSet = {};
  encodingsSet[PARQUET_RDLVL_ENCODING] = true;
  encodingsSet[opts.column.encoding] = true;
  for (const k in encodingsSet) {
    metadata.encodings.push(parquetThrift.Encoding[k]);
  }

  /* concat metadata header and data pages */
  const metadataOffset = opts.baseOffset + pagesBuf.length;
  const body = Buffer.concat([pagesBuf, serializeThrift(metadata)]);
  return {body, metadata, metadataOffset};
}

/**
 * Encode a list of column values into a parquet row group
 */
function encodeRowGroup(schema, data, opts) {
  const metadata = new parquetThrift.RowGroup();
  metadata.num_rows = data.rowCount;
  metadata.columns = [];
  metadata.total_byte_size = 0;

  let body = Buffer.alloc(0);
  for (const field of schema.fieldList) {
    if (field.isNested) {
      continue; // eslint-disable-line no-continue
    }

    const cchunkData = encodeColumnChunk(data.columnData[field.path], {
      column: field,
      baseOffset: opts.baseOffset + body.length,
      pageSize: opts.pageSize,
      encoding: field.encoding,
      rowCount: data.rowCount,
      useDataPageV2: opts.useDataPageV2
    });

    const cchunk = new parquetThrift.ColumnChunk();
    cchunk.file_offset = cchunkData.metadataOffset;
    cchunk.meta_data = cchunkData.metadata;
    metadata.columns.push(cchunk);
    metadata.total_byte_size += cchunkData.body.length;

    body = Buffer.concat([body, cchunkData.body]);
  }

  return {body, metadata};
}

/**
 * Encode a parquet file metadata footer
 */
// eslint-disable-next-line max-statements
function encodeFooter(schema, rowCount, rowGroups, userMetadata) {
  const metadata = new parquetThrift.FileMetaData();
  metadata.version = PARQUET_VERSION;
  metadata.created_by = 'parquet.js';
  metadata.num_rows = rowCount;
  metadata.row_groups = rowGroups;
  metadata.schema = [];
  metadata.key_value_metadata = [];

  for (const k in userMetadata) {
    const kv = new parquetThrift.KeyValue();
    kv.key = k;
    kv.value = userMetadata[k];
    metadata.key_value_metadata.push(kv);
  }

  {
    const schemaRoot = new parquetThrift.SchemaElement();
    schemaRoot.name = 'root';
    schemaRoot.num_children = Object.keys(schema.fields).length;
    metadata.schema.push(schemaRoot);
  }

  for (const field of schema.fieldList) {
    const schemaElem = new parquetThrift.SchemaElement();
    schemaElem.name = field.name;
    schemaElem.repetition_type = parquetThrift.FieldRepetitionType[field.repetitionType];

    if (field.isNested) {
      schemaElem.num_children = field.fieldCount;
    } else {
      schemaElem.type = parquetThrift.Type[field.primitiveType];
    }

    if (field.originalType) {
      schemaElem.converted_type = parquetThrift.ConvertedType[field.originalType];
    }

    schemaElem.type_length = field.typeLength;

    metadata.schema.push(schemaElem);
  }

  const metadataEncoded = serializeThrift(metadata);
  const footerEncoded = new Buffer(metadataEncoded.length + 8);
  metadataEncoded.copy(footerEncoded);
  footerEncoded.writeUInt32LE(metadataEncoded.length, metadataEncoded.length);
  footerEncoded.write(PARQUET_MAGIC, metadataEncoded.length + 4);
  return footerEncoded;
}
