// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license

/* eslint-disable camelcase */
import {stream} from '@loaders.gl/loader-utils';
import {getWKBGeometryStatistics, type WKBGeometryBoundingBox} from '@loaders.gl/gis';
import {ParquetCodecOptions, PARQUET_CODECS} from '../codecs/index';
import * as Compression from '../compression';
import type {
  ParquetRowGroup,
  ParquetCodec,
  ParquetColumnChunk,
  ParquetField,
  ParquetLogicalType,
  PrimitiveType,
  ParquetRow
} from '../schema/declare';
import {ParquetSchema} from '../schema/schema';
import * as Shred from '../schema/shred';
import {
  BsonType,
  BoundingBox,
  ColumnChunk,
  ColumnMetaData,
  CompressionCodec,
  ConvertedType,
  DataPageHeader,
  DataPageHeaderV2,
  DateType,
  DecimalType,
  DictionaryPageHeader,
  EdgeInterpolationAlgorithm,
  Encoding,
  EnumType,
  FieldRepetitionType,
  FileMetaData,
  Float16Type,
  GeographyType,
  GeospatialStatistics,
  GeometryType,
  IntType,
  JsonType,
  KeyValue,
  ListType,
  LogicalType,
  MapType,
  MicroSeconds,
  MilliSeconds,
  NanoSeconds,
  NullType,
  PageHeader,
  PageEncodingStats,
  PageType,
  RowGroup,
  SchemaElement,
  StringType,
  TimeType,
  TimeUnit,
  TimestampType,
  Type,
  UUIDType,
  VariantType
} from '../parquet-thrift/index';
import {osopen, oswrite, osclose} from '../utils/file-utils';
import {getBitWidth, serializeThrift} from '../utils/read-utils';
import {concatUint8Arrays, encodeUtf8, writeUInt32LE} from '../utils/binary-utils';
import {CompactInt64} from '../utils/uint8-array-compact-protocol';
import {planColumnPages} from './page-planner';
import {planDictionary, type ParquetDictionaryPolicy} from './dictionary-planner';

/**
 * Parquet File Magic String
 */
const PARQUET_MAGIC = 'PAR1';
const PARQUET_MAGIC_BYTES = encodeUtf8(PARQUET_MAGIC);

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

export interface ParquetEncoderOptions {
  baseOffset?: number;
  rowGroupSize?: number;
  pageSize?: number;
  useDataPageV2?: boolean;
  dictionary?: ParquetDictionaryPolicy;
  columnDictionaries?: Record<string, ParquetDictionaryPolicy>;
  dictionaryPageSizeLimit?: number;

  // Write Stream Options
  flags?: string;
  encoding?: string;
  fd?: number;
  mode?: number;
  autoClose?: boolean;
  start?: number;
}

/**
 * Write a parquet file to an output stream. The ParquetEncoder will perform
 * buffering/batching for performance, so close() must be called after all rows
 * are written.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class ParquetEncoder<_T> {
  /**
   * Convenience method to create a new buffered parquet writer that writes to
   * the specified file
   */
  static async openFile<T>(
    schema: ParquetSchema,
    path: string,
    opts?: ParquetEncoderOptions
  ): Promise<ParquetEncoder<T>> {
    const outputStream = await osopen(path, opts);
    return ParquetEncoder.openStream(schema, outputStream, opts);
  }

  /**
   * Convenience method to create a new buffered parquet writer that writes to
   * the specified stream
   */
  static async openStream<T>(
    schema: ParquetSchema,
    outputStream: stream.Writable,
    opts: ParquetEncoderOptions = {}
  ): Promise<ParquetEncoder<T>> {
    const envelopeWriter = await ParquetEnvelopeWriter.openStream(schema, outputStream, opts);
    return new ParquetEncoder(schema, envelopeWriter, opts);
  }

  public schema: ParquetSchema;
  public envelopeWriter: ParquetEnvelopeWriter;
  public rowBuffer: ParquetRowGroup;
  public rowGroupSize: number;
  public closed: boolean;
  public userMetadata: Record<string, string>;

  /**
   * Create a new buffered parquet writer for a given envelope writer
   */
  constructor(
    schema: ParquetSchema,
    envelopeWriter: ParquetEnvelopeWriter,
    opts: ParquetEncoderOptions
  ) {
    this.schema = schema;
    this.envelopeWriter = envelopeWriter;
    this.rowBuffer = schema.rowGroup();
    this.rowGroupSize = opts.rowGroupSize || PARQUET_DEFAULT_ROW_GROUP_SIZE;
    this.closed = false;
    this.userMetadata = {};

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.writeHeader();
  }

  async writeHeader(): Promise<void> {
    // TODO - better not mess with promises in the constructor
    try {
      await this.envelopeWriter.writeHeader();
    } catch (err) {
      await this.envelopeWriter.close();
      throw err;
    }
  }

  /**
   * Append a single row to the parquet file. Rows are buffered in memory until
   * rowGroupSize rows are in the buffer or close() is called
   */
  async appendRow<T extends ParquetRow>(row: T): Promise<void> {
    if (this.closed) {
      throw new Error('writer was closed');
    }
    Shred.shredRecord(this.schema, row, this.rowBuffer);
    if (this.rowBuffer.rowCount >= this.rowGroupSize) {
      await this.envelopeWriter.writeRowGroup(this.rowBuffer);
      this.rowBuffer = this.schema.rowGroup();
    }
  }

  /**
   * Finish writing the parquet file and commit the footer to disk. This method
   * MUST be called after you are finished adding rows. You must not call this
   * method twice on the same object or add any rows after the close() method has
   * been called
   */
  async close(callback?: () => void): Promise<void> {
    if (this.closed) {
      throw new Error('writer was closed');
    }

    this.closed = true;

    if (this.rowBuffer.rowCount > 0 || this.rowBuffer.rowCount >= this.rowGroupSize) {
      await this.envelopeWriter.writeRowGroup(this.rowBuffer);
      this.rowBuffer = this.schema.rowGroup();
    }

    await this.envelopeWriter.writeFooter(this.userMetadata);
    await this.envelopeWriter.close();
    // this.envelopeWriter = null;

    if (callback) {
      callback();
    }
  }

  /**
   * Add key<>value metadata to the file
   */
  setMetadata(key: string, value: string): void {
    // TODO: value to be any, obj -> JSON
    this.userMetadata[String(key)] = String(value);
  }

  /**
   * Set the parquet row group size. This values controls the maximum number
   * of rows that are buffered in memory at any given time as well as the number
   * of rows that are co-located on disk. A higher value is generally better for
   * read-time I/O performance at the tradeoff of write-time memory usage.
   */
  setRowGroupSize(cnt: number): void {
    this.rowGroupSize = cnt;
  }

  /**
   * Set the parquet data page size. The data page size controls the maximum
   * number of column values that are written to disk as a consecutive array
   */
  setPageSize(cnt: number): void {
    this.envelopeWriter.setPageSize(cnt);
  }
}

/**
 * Create a parquet file from a schema and a number of row groups. This class
 * performs direct, unbuffered writes to the underlying output stream and is
 * intendend for advanced and internal users; the writeXXX methods must be
 * called in the correct order to produce a valid file.
 */
export class ParquetEnvelopeWriter {
  /**
   * Create a new parquet envelope writer that writes to the specified stream
   */
  static async openStream(
    schema: ParquetSchema,
    outputStream: stream.Writable,
    opts: ParquetEncoderOptions
  ): Promise<ParquetEnvelopeWriter> {
    const writeFn = oswrite.bind(undefined, outputStream);
    const closeFn = osclose.bind(undefined, outputStream);
    return new ParquetEnvelopeWriter(schema, writeFn, closeFn, 0, opts);
  }

  public schema: ParquetSchema;
  public write: (buf: Uint8Array) => Promise<void>;
  public close: () => Promise<void>;
  public offset: number;
  public rowCount: number;
  public rowGroups: RowGroup[];
  public pageSize: number;
  public useDataPageV2: boolean;
  public dictionary: ParquetDictionaryPolicy;
  public columnDictionaries: Record<string, ParquetDictionaryPolicy>;
  public dictionaryPageSizeLimit: number;

  constructor(
    schema: ParquetSchema,
    writeFn: (buf: Uint8Array) => Promise<void>,
    closeFn: () => Promise<void>,
    fileOffset: number,
    opts: ParquetEncoderOptions
  ) {
    this.schema = schema;
    this.write = writeFn;
    this.close = closeFn;
    this.offset = fileOffset;
    this.rowCount = 0;
    this.rowGroups = [];
    this.pageSize = opts.pageSize || PARQUET_DEFAULT_PAGE_SIZE;
    this.useDataPageV2 = 'useDataPageV2' in opts ? Boolean(opts.useDataPageV2) : false;
    this.dictionary = opts.dictionary ?? 'auto';
    this.columnDictionaries = opts.columnDictionaries || {};
    this.dictionaryPageSizeLimit = opts.dictionaryPageSizeLimit ?? 1024 * 1024;
  }

  writeSection(buf: Uint8Array): Promise<void> {
    this.offset += buf.length;
    return this.write(buf);
  }

  /**
   * Encode the parquet file header
   */
  writeHeader(): Promise<void> {
    return this.writeSection(PARQUET_MAGIC_BYTES);
  }

  /**
   * Encode a parquet row group. The records object should be created using the
   * shredRecord method
   */
  async writeRowGroup(records: ParquetRowGroup): Promise<void> {
    const rgroup = await encodeRowGroup(this.schema, records, {
      baseOffset: this.offset,
      pageSize: this.pageSize,
      useDataPageV2: this.useDataPageV2,
      dictionary: this.dictionary,
      columnDictionaries: this.columnDictionaries,
      dictionaryPageSizeLimit: this.dictionaryPageSizeLimit
    });

    this.rowCount += records.rowCount;
    this.rowGroups.push(rgroup.metadata);
    return await this.writeSection(rgroup.body);
  }

  /**
   * Write the parquet file footer
   */
  writeFooter(userMetadata: Record<string, string>): Promise<void> {
    if (!userMetadata) {
      // tslint:disable-next-line:no-parameter-reassignment
      userMetadata = {};
    }

    return this.writeSection(
      encodeFooter(this.schema, this.rowCount, this.rowGroups, userMetadata)
    );
  }

  /**
   * Set the parquet data page size. The data page size controls the maximum
   * number of column values that are written to disk as a consecutive array
   */
  setPageSize(cnt: number): void {
    this.pageSize = cnt;
  }
}

/**
 * Create a parquet transform stream
export class ParquetTransformer<T> extends stream.Transform {
  public writer: ParquetEncoder<T>;

  constructor(schema: ParquetSchema, opts: ParquetEncoderOptions = {}) {
    super({objectMode: true});

    const writeProxy = (function (t: ParquetTransformer<any>) {
      return async function (b: any): Promise<void> {
        t.push(b);
      };
    })(this);

    this.writer = new ParquetEncoder(
      schema,
      new ParquetEnvelopeWriter(schema, writeProxy, async () => {}, 0, opts),
      opts
    );
  }

  // tslint:disable-next-line:function-name
  _transform(row: any, encoding: string, callback: (val?: any) => void): Promise<void> {
    if (row) {
      return this.writer.appendRow(row).then(callback);
    }
    callback();
    return Promise.resolve();
  }

  // tslint:disable-next-line:function-name
  async _flush(callback: (val?: any) => void) {
    await this.writer.close(callback);
  }
}
 */

/**
 * Encode a consecutive array of data using one of the parquet encodings
 */
function encodeValues(
  type: PrimitiveType,
  encoding: ParquetCodec,
  values: any[],
  opts: ParquetCodecOptions
) {
  if (!(encoding in PARQUET_CODECS)) {
    throw new Error(`invalid encoding: ${encoding}`);
  }
  return PARQUET_CODECS[encoding].encodeValues(type, values, opts);
}

/**
 * Encode a parquet data page
 */
async function encodeDataPage(
  column: ParquetField,
  data: ParquetColumnChunk,
  valueEncoding: ParquetCodec = column.encoding!,
  valueBitWidth?: number
): Promise<{
  header: PageHeader;
  headerSize: number;
  page: Uint8Array;
}> {
  /* encode repetition and definition levels */
  let rLevelsBuf: Uint8Array = new Uint8Array(0);
  if (column.rLevelMax > 0) {
    rLevelsBuf = encodeValues(
      PARQUET_RDLVL_TYPE,
      PARQUET_RDLVL_ENCODING,
      data.rlevels as number[],
      {
        bitWidth: getBitWidth(column.rLevelMax)
        // disableEnvelope: false
      }
    );
  }

  let dLevelsBuf: Uint8Array = new Uint8Array(0);
  if (column.dLevelMax > 0) {
    dLevelsBuf = encodeValues(
      PARQUET_RDLVL_TYPE,
      PARQUET_RDLVL_ENCODING,
      data.dlevels as number[],
      {
        bitWidth: getBitWidth(column.dLevelMax)
        // disableEnvelope: false
      }
    );
  }

  /* encode values */
  const valuesBuf = encodeValues(column.primitiveType!, valueEncoding, data.values as any[], {
    typeLength: column.typeLength,
    bitWidth: valueBitWidth ?? column.typeLength
  });

  const dataBuf = concatUint8Arrays([rLevelsBuf, dLevelsBuf, valuesBuf]);

  // compression = column.compression === 'UNCOMPRESSED' ? (compression || 'UNCOMPRESSED') : column.compression;
  const compressedBuf = await Compression.deflate(column.compression!, dataBuf);

  /* build page header */
  const header = new PageHeader({
    type: PageType.DATA_PAGE,
    data_page_header: new DataPageHeader({
      num_values: data.count,
      encoding: Encoding[valueEncoding] as any,
      definition_level_encoding: Encoding[PARQUET_RDLVL_ENCODING], // [PARQUET_RDLVL_ENCODING],
      repetition_level_encoding: Encoding[PARQUET_RDLVL_ENCODING] // [PARQUET_RDLVL_ENCODING]
    }),
    uncompressed_page_size: dataBuf.length,
    compressed_page_size: compressedBuf.length
  });

  /* concat page header, repetition and definition levels and values */
  const headerBuf = serializeThrift(header);
  const page = concatUint8Arrays([headerBuf, compressedBuf]);

  return {header, headerSize: headerBuf.length, page};
}

/**
 * Encode a parquet data page (v2)
 */
async function encodeDataPageV2(
  column: ParquetField,
  data: ParquetColumnChunk,
  rowCount: number,
  valueEncoding: ParquetCodec = column.encoding!,
  valueBitWidth?: number
): Promise<{
  header: PageHeader;
  headerSize: number;
  page: Uint8Array;
}> {
  /* encode values */
  const valuesBuf = encodeValues(column.primitiveType!, valueEncoding, data.values as any[], {
    typeLength: column.typeLength,
    bitWidth: valueBitWidth ?? column.typeLength
  });

  // compression = column.compression === 'UNCOMPRESSED' ? (compression || 'UNCOMPRESSED') : column.compression;
  const compressedBuf = await Compression.deflate(column.compression!, valuesBuf);

  /* encode repetition and definition levels */
  let rLevelsBuf: Uint8Array = new Uint8Array(0);
  if (column.rLevelMax > 0) {
    rLevelsBuf = encodeValues(
      PARQUET_RDLVL_TYPE,
      PARQUET_RDLVL_ENCODING,
      data.rlevels as number[],
      {
        bitWidth: getBitWidth(column.rLevelMax),
        disableEnvelope: true
      }
    );
  }

  let dLevelsBuf: Uint8Array = new Uint8Array(0);
  if (column.dLevelMax > 0) {
    dLevelsBuf = encodeValues(
      PARQUET_RDLVL_TYPE,
      PARQUET_RDLVL_ENCODING,
      data.dlevels as number[],
      {
        bitWidth: getBitWidth(column.dLevelMax),
        disableEnvelope: true
      }
    );
  }

  /* build page header */
  const header = new PageHeader({
    type: PageType.DATA_PAGE_V2,
    data_page_header_v2: new DataPageHeaderV2({
      num_values: data.count,
      num_nulls: data.count - data.values.length,
      num_rows: rowCount,
      encoding: Encoding[valueEncoding] as any,
      definition_levels_byte_length: dLevelsBuf.length,
      repetition_levels_byte_length: rLevelsBuf.length,
      is_compressed: column.compression !== 'UNCOMPRESSED'
    }),
    uncompressed_page_size: rLevelsBuf.length + dLevelsBuf.length + valuesBuf.length,
    compressed_page_size: rLevelsBuf.length + dLevelsBuf.length + compressedBuf.length
  });

  /* concat page header, repetition and definition levels and values */
  const headerBuf = serializeThrift(header);
  const page = concatUint8Arrays([headerBuf, rLevelsBuf, dLevelsBuf, compressedBuf]);
  return {header, headerSize: headerBuf.length, page};
}

/** Encodes one chunk-wide PLAIN dictionary page. */
async function encodeDictionaryPage(
  column: ParquetField,
  dictionaryValues: unknown[]
): Promise<{header: PageHeader; headerSize: number; page: Uint8Array}> {
  const valuesBuffer = encodeValues(column.primitiveType!, 'PLAIN', dictionaryValues as any[], {
    typeLength: column.typeLength
  });
  const compressedBuffer = await Compression.deflate(column.compression!, valuesBuffer);
  const header = new PageHeader({
    type: PageType.DICTIONARY_PAGE,
    dictionary_page_header: new DictionaryPageHeader({
      num_values: dictionaryValues.length,
      encoding: Encoding.PLAIN
    }),
    uncompressed_page_size: valuesBuffer.length,
    compressed_page_size: compressedBuffer.length
  });
  const headerBuffer = serializeThrift(header);
  return {
    header,
    headerSize: headerBuffer.length,
    page: concatUint8Arrays([headerBuffer, compressedBuffer])
  };
}

/** Computes native Parquet geospatial statistics for a GEOMETRY or GEOGRAPHY column chunk. */
function createGeospatialStatistics(
  column: ParquetField,
  values: ParquetColumnChunk['values']
): GeospatialStatistics | undefined {
  const logicalType = column.logicalType?.type || column.originalType;
  if (logicalType !== 'GEOMETRY' && logicalType !== 'GEOGRAPHY') return undefined;
  const geometryTypes = new Set<number>();
  let bbox: WKBGeometryBoundingBox | undefined;
  for (const value of values) {
    if (!(value instanceof ArrayBuffer) && !ArrayBuffer.isView(value)) {
      throw new Error(`${logicalType} columns must contain WKB binary values`);
    }
    const statistics = getWKBGeometryStatistics(value);
    geometryTypes.add(statistics.geometryType);
    bbox = mergeGeometryBoundingBoxes(bbox, statistics.bbox);
  }
  return new GeospatialStatistics({
    bbox: bbox ? new BoundingBox(bbox) : undefined,
    geospatial_types: [...geometryTypes].sort((left, right) => left - right)
  });
}

/** Merges finite per-dimension bounds without inventing absent Z or M dimensions. */
function mergeGeometryBoundingBoxes(
  target: WKBGeometryBoundingBox | undefined,
  source: WKBGeometryBoundingBox | undefined
): WKBGeometryBoundingBox | undefined {
  if (!source) return target;
  if (!target) return {...source};
  target.xmin = Math.min(target.xmin, source.xmin);
  target.xmax = Math.max(target.xmax, source.xmax);
  target.ymin = Math.min(target.ymin, source.ymin);
  target.ymax = Math.max(target.ymax, source.ymax);
  mergeOptionalBounds(target, source, 'zmin', Math.min);
  mergeOptionalBounds(target, source, 'zmax', Math.max);
  mergeOptionalBounds(target, source, 'mmin', Math.min);
  mergeOptionalBounds(target, source, 'mmax', Math.max);
  return target;
}

/** Merges one optional bound while preserving a dimension absent from every value. */
function mergeOptionalBounds(
  target: WKBGeometryBoundingBox,
  source: WKBGeometryBoundingBox,
  key: 'zmin' | 'zmax' | 'mmin' | 'mmax',
  merge: (left: number, right: number) => number
): void {
  const sourceValue = source[key];
  if (sourceValue === undefined) return;
  target[key] = target[key] === undefined ? sourceValue : merge(target[key]!, sourceValue);
}

/**
 * Encode an array of values into a parquet column chunk
 */
async function encodeColumnChunk(
  column: ParquetField,
  buffer: ParquetRowGroup,
  offset: number,
  opts: ParquetEncoderOptions
): Promise<{
  body: Uint8Array;
  metadata: ColumnMetaData;
  metadataOffset: number;
}> {
  const data = buffer.columnData[column.path.join()];
  const baseOffset = (opts.baseOffset || 0) + offset;
  /* encode data page(s) */
  const pages: Uint8Array[] = [];
  // tslint:disable-next-line:variable-name
  let total_uncompressed_size = 0;
  // tslint:disable-next-line:variable-name
  let total_compressed_size = 0;
  const plannedPages = planColumnPages(
    column,
    data,
    buffer.rowCount,
    opts.pageSize || PARQUET_DEFAULT_PAGE_SIZE
  );
  const dictionaryPolicy =
    opts.columnDictionaries?.[column.path[0]] ?? opts.dictionary ?? ('auto' as const);
  const dictionaryPlan = planDictionary(
    column,
    Array.from(data.values),
    dictionaryPolicy,
    opts.dictionaryPageSizeLimit ?? 1024 * 1024
  );
  if (dictionaryPlan) {
    const result = await encodeDictionaryPage(column, dictionaryPlan.values);
    pages.push(result.page);
    total_uncompressed_size += result.header.uncompressed_page_size + result.headerSize;
    total_compressed_size += result.header.compressed_page_size + result.headerSize;
  }

  const valueEncoding: ParquetCodec = dictionaryPlan ? 'RLE_DICTIONARY' : column.encoding!;
  let dictionaryIndexOffset = 0;
  for (const plannedPage of plannedPages) {
    const pageData = dictionaryPlan
      ? {
          ...plannedPage.data,
          values: dictionaryPlan.indices.slice(
            dictionaryIndexOffset,
            dictionaryIndexOffset + plannedPage.data.values.length
          )
        }
      : plannedPage.data;
    dictionaryIndexOffset += plannedPage.data.values.length;
    const result = opts.useDataPageV2
      ? await encodeDataPageV2(
          column,
          pageData,
          plannedPage.rowCount,
          valueEncoding,
          dictionaryPlan?.bitWidth
        )
      : await encodeDataPage(column, pageData, valueEncoding, dictionaryPlan?.bitWidth);
    pages.push(result.page);
    total_uncompressed_size += result.header.uncompressed_page_size + result.headerSize;
    total_compressed_size += result.header.compressed_page_size + result.headerSize;
  }

  const pagesBuf = concatUint8Arrays(pages);
  // const compression = column.compression === 'UNCOMPRESSED' ? (opts.compression || 'UNCOMPRESSED') : column.compression;

  /* prepare metadata header */
  const metadata = new ColumnMetaData({
    path_in_schema: column.path,
    num_values: int64(data.count),
    data_page_offset: int64(baseOffset + (dictionaryPlan ? pages[0].length : 0)),
    dictionary_page_offset: dictionaryPlan ? int64(baseOffset) : undefined,
    encodings: [],
    encoding_stats: [
      ...(dictionaryPlan
        ? [
            new PageEncodingStats({
              page_type: PageType.DICTIONARY_PAGE,
              encoding: Encoding.PLAIN,
              count: 1
            })
          ]
        : []),
      new PageEncodingStats({
        page_type: opts.useDataPageV2 ? PageType.DATA_PAGE_V2 : PageType.DATA_PAGE,
        encoding: Encoding[valueEncoding],
        count: plannedPages.length
      })
    ],
    total_uncompressed_size: int64(total_uncompressed_size), //  : pagesBuf.length,
    total_compressed_size: int64(total_compressed_size),
    type: Type[column.primitiveType!],
    codec: CompressionCodec[column.compression!],
    geospatial_statistics: createGeospatialStatistics(column, data.values)
  });

  /* list encodings */
  metadata.encodings.push(Encoding[PARQUET_RDLVL_ENCODING]);
  if (dictionaryPlan) metadata.encodings.push(Encoding.PLAIN);
  metadata.encodings.push(Encoding[valueEncoding]);

  /* concat metadata header and data pages */
  const metadataOffset = baseOffset + pagesBuf.length;
  const body = concatUint8Arrays([pagesBuf, serializeThrift(metadata)]);
  return {body, metadata, metadataOffset};
}

/**
 * Encode a list of column values into a parquet row group
 */
async function encodeRowGroup(
  schema: ParquetSchema,
  data: ParquetRowGroup,
  opts: ParquetEncoderOptions
): Promise<{
  body: Uint8Array;
  metadata: RowGroup;
}> {
  const metadata = new RowGroup({
    num_rows: int64(data.rowCount),
    columns: [],
    total_byte_size: int64(0)
  });

  let body: Uint8Array = new Uint8Array(0);
  for (const field of schema.fieldList) {
    if (field.isNested) {
      continue; // eslint-disable-line no-continue
    }

    const cchunkData = await encodeColumnChunk(field, data, body.length, opts);

    const cchunk = new ColumnChunk({
      file_offset: int64(cchunkData.metadataOffset),
      meta_data: cchunkData.metadata
    });

    metadata.columns.push(cchunk);
    metadata.total_byte_size = int64(Number(metadata.total_byte_size) + cchunkData.body.length);

    body = concatUint8Arrays([body, cchunkData.body]);
  }

  return {body, metadata};
}

/**
 * Encode a parquet file metadata footer
 */
function encodeFooter(
  schema: ParquetSchema,
  rowCount: number,
  rowGroups: RowGroup[],
  userMetadata: Record<string, string>
): Uint8Array {
  const metadata = new FileMetaData({
    version: PARQUET_VERSION,
    created_by: 'parquets',
    num_rows: int64(rowCount),
    row_groups: rowGroups,
    schema: [],
    key_value_metadata: []
  });

  for (const key in userMetadata) {
    const kv = new KeyValue({
      key,
      value: userMetadata[key]
    });
    metadata.key_value_metadata?.push?.(kv);
  }

  {
    const schemaRoot = new SchemaElement({
      name: 'root',
      num_children: Object.keys(schema.fields).length
    });
    metadata.schema.push(schemaRoot);
  }

  for (const field of schema.fieldList) {
    const relt = FieldRepetitionType[field.repetitionType];
    const schemaElem = new SchemaElement({
      name: field.name,
      repetition_type: relt as any
    });

    if (field.isNested) {
      schemaElem.num_children = field.fieldCount;
    } else {
      schemaElem.type = Type[field.primitiveType!] as Type;
    }

    if (field.originalType) {
      const convertedType = ConvertedType[field.originalType as keyof typeof ConvertedType];
      if (typeof convertedType === 'number') {
        schemaElem.converted_type = convertedType;
      }
    }

    schemaElem.type_length = field.typeLength;
    schemaElem.precision = field.precision ?? field.presision;
    schemaElem.scale = field.scale;
    schemaElem.field_id = field.fieldId;
    const logicalType = getFieldLogicalType(field);
    if (logicalType) {
      schemaElem.logicalType = encodeParquetLogicalType(logicalType);
    }

    metadata.schema.push(schemaElem);
  }

  const metadataEncoded = serializeThrift(metadata);
  const footerEncoded = new Uint8Array(metadataEncoded.length + 8);

  footerEncoded.set(metadataEncoded);
  writeUInt32LE(footerEncoded, metadataEncoded.length, metadataEncoded.length);
  footerEncoded.set(PARQUET_MAGIC_BYTES, metadataEncoded.length + 4);
  return footerEncoded;
}

/** Returns an explicit or inferred modern logical annotation for a writer field. */
function getFieldLogicalType(field: ParquetField): ParquetLogicalType | undefined {
  if (field.logicalType) return field.logicalType;
  const originalType = field.originalType;
  if (!originalType) return undefined;
  if (originalType === 'UTF8') return {type: 'STRING'};
  if (originalType === 'ENUM') return {type: 'ENUM'};
  if (originalType.startsWith('DECIMAL_')) {
    return {
      type: 'DECIMAL',
      precision: field.precision ?? field.presision,
      scale: field.scale
    };
  }
  if (originalType === 'DATE') return {type: 'DATE'};
  if (originalType.startsWith('TIME_')) {
    return {
      type: 'TIME',
      unit: originalType.slice(5) as ParquetLogicalType['unit'],
      isAdjustedToUTC: true
    };
  }
  if (originalType.startsWith('TIMESTAMP_')) {
    return {
      type: 'TIMESTAMP',
      unit: originalType.slice(10) as ParquetLogicalType['unit'],
      isAdjustedToUTC: true
    };
  }
  if (originalType.startsWith('UINT_') || originalType.startsWith('INT_')) {
    return {
      type: 'INTEGER',
      bitWidth: Number(originalType.slice(originalType.indexOf('_') + 1)) as 8 | 16 | 32 | 64,
      isSigned: originalType.startsWith('INT_')
    };
  }
  if (originalType === 'JSON' || originalType === 'BSON') return {type: originalType};
  if (
    originalType === 'UUID' ||
    originalType === 'FLOAT16' ||
    originalType === 'UNKNOWN' ||
    originalType === 'VARIANT' ||
    originalType === 'GEOMETRY' ||
    originalType === 'GEOGRAPHY'
  ) {
    return {type: originalType};
  }
  return undefined;
}

/** Converts the internal logical annotation into the Parquet 2.13 Thrift union. */
function encodeParquetLogicalType(logicalType: ParquetLogicalType): LogicalType {
  switch (logicalType.type) {
    case 'STRING':
      return LogicalType.fromSTRING(new StringType());
    case 'MAP':
      return LogicalType.fromMAP(new MapType());
    case 'LIST':
      return LogicalType.fromLIST(new ListType());
    case 'ENUM':
      return LogicalType.fromENUM(new EnumType());
    case 'DECIMAL':
      if (logicalType.precision === undefined || logicalType.scale === undefined) {
        throw new Error('Parquet DECIMAL requires precision and scale');
      }
      return LogicalType.fromDECIMAL(
        new DecimalType({precision: logicalType.precision, scale: logicalType.scale})
      );
    case 'DATE':
      return LogicalType.fromDATE(new DateType());
    case 'TIME':
      return LogicalType.fromTIME(
        new TimeType({
          isAdjustedToUTC: logicalType.isAdjustedToUTC ?? false,
          unit: encodeParquetTimeUnit(logicalType.unit)
        })
      );
    case 'TIMESTAMP':
      return LogicalType.fromTIMESTAMP(
        new TimestampType({
          isAdjustedToUTC: logicalType.isAdjustedToUTC ?? false,
          unit: encodeParquetTimeUnit(logicalType.unit)
        })
      );
    case 'INTEGER':
      if (logicalType.bitWidth === undefined || logicalType.isSigned === undefined) {
        throw new Error('Parquet INTEGER requires bitWidth and isSigned');
      }
      return LogicalType.fromINTEGER(
        new IntType({bitWidth: logicalType.bitWidth, isSigned: logicalType.isSigned})
      );
    case 'UNKNOWN':
      return LogicalType.fromUNKNOWN(new NullType());
    case 'JSON':
      return LogicalType.fromJSON(new JsonType());
    case 'BSON':
      return LogicalType.fromBSON(new BsonType());
    case 'UUID':
      return LogicalType.fromUUID(new UUIDType());
    case 'FLOAT16':
      return LogicalType.fromFLOAT16(new Float16Type());
    case 'VARIANT':
      return LogicalType.fromVARIANT(
        new VariantType({specification_version: logicalType.specificationVersion})
      );
    case 'GEOMETRY':
      return LogicalType.fromGEOMETRY(new GeometryType({crs: logicalType.crs}));
    case 'GEOGRAPHY':
      return LogicalType.fromGEOGRAPHY(
        new GeographyType({
          crs: logicalType.crs,
          algorithm:
            logicalType.algorithm === undefined
              ? undefined
              : EdgeInterpolationAlgorithm[
                  logicalType.algorithm as keyof typeof EdgeInterpolationAlgorithm
                ]
        })
      );
    default:
      throw new Error(
        `Unsupported Parquet logical type ${(logicalType as ParquetLogicalType).type}`
      );
  }
}

/** Encodes one Parquet logical time unit. */
function encodeParquetTimeUnit(unit: ParquetLogicalType['unit']): TimeUnit {
  switch (unit) {
    case 'MILLIS':
      return TimeUnit.fromMILLIS(new MilliSeconds());
    case 'MICROS':
      return TimeUnit.fromMICROS(new MicroSeconds());
    case 'NANOS':
      return TimeUnit.fromNANOS(new NanoSeconds());
    default:
      throw new Error('Parquet TIME and TIMESTAMP require a unit');
  }
}

/** Wrap a writer metadata number in the thrift int64 compatibility object. */
function int64(value: number): any {
  return new CompactInt64(BigInt(value));
}
