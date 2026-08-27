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
  ColumnIndex,
  ColumnMetaData,
  SizeStatistics,
  Statistics,
  SortingColumn,
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
  PageLocation,
  RowGroup,
  SchemaElement,
  StringType,
  TimeType,
  TimeUnit,
  TimestampType,
  Type,
  UUIDType,
  VariantType,
  OffsetIndex
} from '../parquet-thrift/index';
import {osopen, oswrite, osclose} from '../utils/file-utils';
import {getBitWidth, serializeThrift} from '../utils/read-utils';
import {concatUint8Arrays, encodeUtf8, writeUInt32LE} from '../utils/binary-utils';
import {crc32} from '../utils/crc32';
import {CompactInt64} from '../utils/uint8-array-compact-protocol';
import {planColumnPages} from './page-planner';
import {planDictionary, type ParquetDictionaryPolicy} from './dictionary-planner';
import {
  encodeParquetBloomFilterValue,
  encodeParquetSplitBlockBloomFilter
} from '../../lib/parquet-bloom-filter';
import {BoundaryOrder} from '../parquet-thrift/BoundaryOrder';
import {EncryptionAlgorithm} from '../parquet-thrift/EncryptionAlgorithm';
import {FileCryptoMetaData} from '../parquet-thrift/FileCryptoMetaData';
import {PARQUET_MAGIC_ENCRYPTED} from '../../lib/constants';
import {
  createParquetModuleAad,
  encryptParquetModule,
  type ParquetWriterEncryptionOptions
} from '../../lib/parquet-encryption';

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
  bloomFilter?: boolean | Record<string, boolean>;
  pageIndex?: boolean | Record<string, boolean>;
  /** Emit CRC-32 checksums for page bodies. */
  writePageChecksums?: boolean;
  /** Emit optional SizeStatistics metadata for each column chunk. */
  writeSizeStatistics?: boolean;
  /** Emit optional min/max/null-count statistics for each column chunk. */
  writeStatistics?: boolean | Record<string, boolean>;
  /** Declare the row-group sort order using top-level or dotted leaf column names. */
  sortingColumns?: readonly ParquetSortingColumnOption[];
  /** Encrypt the footer using Parquet modular encryption. */
  encryption?: ParquetWriterEncryptionOptions;

  // Write Stream Options
  flags?: string;
  encoding?: string;
  fd?: number;
  mode?: number;
  autoClose?: boolean;
  start?: number;
}

/** Writer-facing declaration for one row-group sort key. */
export type ParquetSortingColumnOption = {
  /** Top-level field name or dotted nested leaf path. */
  column: string;
  /** Sort direction; defaults to ascending. */
  descending?: boolean;
  /** Whether null values sort before non-null values; defaults to false. */
  nullsFirst?: boolean;
};

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
  public bloomFilter?: boolean | Record<string, boolean>;
  public pageIndex?: boolean | Record<string, boolean>;
  public writePageChecksums: boolean;
  public writeSizeStatistics: boolean;
  public writeStatistics?: boolean | Record<string, boolean>;
  public sortingColumns?: readonly ParquetSortingColumnOption[];
  /** Optional modular-encryption configuration for the footer. */
  public encryption?: ParquetWriterEncryptionOptions;

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
    this.bloomFilter = opts.bloomFilter;
    this.pageIndex = opts.pageIndex;
    this.writePageChecksums = Boolean(opts.writePageChecksums);
    this.writeSizeStatistics = Boolean(opts.writeSizeStatistics);
    this.writeStatistics = opts.writeStatistics;
    this.sortingColumns = opts.sortingColumns;
    this.encryption = opts.encryption;
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
      dictionaryPageSizeLimit: this.dictionaryPageSizeLimit,
      bloomFilter: this.bloomFilter,
      pageIndex: this.pageIndex,
      writePageChecksums: this.writePageChecksums,
      writeSizeStatistics: this.writeSizeStatistics,
      writeStatistics: this.writeStatistics,
      sortingColumns: this.sortingColumns
    });

    this.rowCount += records.rowCount;
    this.rowGroups.push(rgroup.metadata);
    return await this.writeSection(rgroup.body);
  }

  /**
   * Write the parquet file footer
   */
  async writeFooter(userMetadata: Record<string, string>): Promise<void> {
    if (!userMetadata) {
      // tslint:disable-next-line:no-parameter-reassignment
      userMetadata = {};
    }

    const footer = encodeFooter(this.schema, this.rowCount, this.rowGroups, userMetadata);
    if (!this.encryption) {
      await this.writeSection(footer);
      return;
    }
    await this.writeSection(await encodeEncryptedFooter(footer, this.encryption));
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
  valueBitWidth?: number,
  writePageChecksums = false,
  statistics?: Statistics
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
      repetition_level_encoding: Encoding[PARQUET_RDLVL_ENCODING], // [PARQUET_RDLVL_ENCODING]
      statistics
    }),
    uncompressed_page_size: dataBuf.length,
    compressed_page_size: compressedBuf.length,
    crc: writePageChecksums ? crc32(compressedBuf) : undefined
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
  valueBitWidth?: number,
  writePageChecksums = false,
  statistics?: Statistics
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
      is_compressed: column.compression !== 'UNCOMPRESSED',
      statistics
    }),
    uncompressed_page_size: rLevelsBuf.length + dLevelsBuf.length + valuesBuf.length,
    compressed_page_size: rLevelsBuf.length + dLevelsBuf.length + compressedBuf.length,
    crc: writePageChecksums
      ? crc32(concatUint8Arrays([rLevelsBuf, dLevelsBuf, compressedBuf]))
      : undefined
  });

  /* concat page header, repetition and definition levels and values */
  const headerBuf = serializeThrift(header);
  const page = concatUint8Arrays([headerBuf, rLevelsBuf, dLevelsBuf, compressedBuf]);
  return {header, headerSize: headerBuf.length, page};
}

/** Encodes one chunk-wide PLAIN dictionary page. */
async function encodeDictionaryPage(
  column: ParquetField,
  dictionaryValues: unknown[],
  writePageChecksums = false
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
    compressed_page_size: compressedBuffer.length,
    crc: writePageChecksums ? crc32(compressedBuffer) : undefined
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
  // Vertex bounds are not conservative for GEOGRAPHY: non-linear edge algorithms can reach
  // extrema between vertices. Until edge-aware geodesic bounds are available, omit the bbox while
  // retaining the useful geometry-type statistics.
  const canWriteBoundingBox = logicalType === 'GEOMETRY';
  for (const value of values) {
    if (!(value instanceof ArrayBuffer) && !ArrayBuffer.isView(value)) {
      throw new Error(`${logicalType} columns must contain WKB binary values`);
    }
    const statistics = getWKBGeometryStatistics(value);
    geometryTypes.add(statistics.geometryType);
    if (canWriteBoundingBox) {
      bbox = mergeGeometryBoundingBoxes(bbox, statistics.bbox);
    }
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
  offsetIndexOffset?: number;
  offsetIndexLength?: number;
  columnIndexOffset?: number;
  columnIndexLength?: number;
}> {
  const data = buffer.columnData[column.path.join()];
  const baseOffset = (opts.baseOffset || 0) + offset;
  /* encode data page(s) */
  const pages: Uint8Array[] = [];
  const pageLocations: PageLocation[] = [];
  let pageOffset = 0;
  let firstRowIndex = 0;
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
    const result = await encodeDictionaryPage(
      column,
      dictionaryPlan.values,
      opts.writePageChecksums
    );
    pages.push(result.page);
    pageOffset += result.page.length;
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
          dictionaryPlan?.bitWidth,
          opts.writePageChecksums,
          isStatisticsEnabled(opts.writeStatistics, column)
            ? createColumnStatistics(column, plannedPage.data)
            : undefined
        )
      : await encodeDataPage(
          column,
          pageData,
          valueEncoding,
          dictionaryPlan?.bitWidth,
          opts.writePageChecksums,
          isStatisticsEnabled(opts.writeStatistics, column)
            ? createColumnStatistics(column, plannedPage.data)
            : undefined
        );
    pageLocations.push(
      new PageLocation({
        offset: baseOffset + pageOffset,
        compressed_page_size: result.page.length,
        first_row_index: firstRowIndex
      })
    );
    firstRowIndex += plannedPage.rowCount;
    pages.push(result.page);
    pageOffset += result.page.length;
    total_uncompressed_size += result.header.uncompressed_page_size + result.headerSize;
    total_compressed_size += result.header.compressed_page_size + result.headerSize;
  }

  const pagesBuf = concatUint8Arrays(pages);
  // const compression = column.compression === 'UNCOMPRESSED' ? (opts.compression || 'UNCOMPRESSED') : column.compression;
  const bloomFilterEnabled =
    opts.bloomFilter === true || opts.bloomFilter?.[column.path[0]] === true;
  const bloomFilter = bloomFilterEnabled ? createColumnBloomFilter(column, data.values) : undefined;
  const pageIndexEnabled = opts.pageIndex === true || opts.pageIndex?.[column.path[0]] === true;
  const pageIndexes = pageIndexEnabled
    ? createColumnPageIndexes(column, plannedPages, pageLocations)
    : undefined;

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
    bloom_filter_offset: bloomFilter ? int64(baseOffset + pagesBuf.length) : undefined,
    bloom_filter_length: bloomFilter?.length,
    geospatial_statistics: createGeospatialStatistics(column, data.values),
    size_statistics: opts.writeSizeStatistics ? createSizeStatistics(column, data) : undefined,
    statistics: isStatisticsEnabled(opts.writeStatistics, column)
      ? createColumnStatistics(column, data)
      : undefined
  });

  /* list encodings */
  metadata.encodings.push(Encoding[PARQUET_RDLVL_ENCODING]);
  if (dictionaryPlan) metadata.encodings.push(Encoding.PLAIN);
  metadata.encodings.push(Encoding[valueEncoding]);

  /* concat metadata header and data pages */
  const metadataOffset = baseOffset + pagesBuf.length + (bloomFilter?.length || 0);
  const metadataEncoded = serializeThrift(metadata);
  const offsetIndexOffset = pageIndexes ? metadataOffset + metadataEncoded.length : undefined;
  const columnIndexOffset = pageIndexes?.columnIndex
    ? metadataOffset + metadataEncoded.length + pageIndexes.offsetIndex.length
    : undefined;
  const body = concatUint8Arrays([
    pagesBuf,
    ...(bloomFilter ? [bloomFilter] : []),
    metadataEncoded,
    ...(pageIndexes
      ? [pageIndexes.offsetIndex, ...(pageIndexes.columnIndex ? [pageIndexes.columnIndex] : [])]
      : [])
  ]);
  return {
    body,
    metadata,
    metadataOffset,
    offsetIndexOffset,
    offsetIndexLength: pageIndexes?.offsetIndex.length,
    columnIndexOffset,
    columnIndexLength: pageIndexes?.columnIndex?.length
  };
}

/** Builds page indexes for primitive leaves, including nested and repeated leaves. */
function createColumnPageIndexes(
  column: ParquetField,
  plannedPages: ReturnType<typeof planColumnPages>,
  pageLocations: PageLocation[]
): {offsetIndex: Uint8Array; columnIndex?: Uint8Array} | undefined {
  if (
    !column.primitiveType ||
    !isPageIndexPhysicalType(column.primitiveType) ||
    plannedPages.length !== pageLocations.length ||
    plannedPages.length === 0
  ) {
    return undefined;
  }

  const offsetIndex = serializeThrift(new OffsetIndex({page_locations: pageLocations}));
  if (!supportsStatisticsSortOrder(column)) {
    return {offsetIndex};
  }

  const nullPages: boolean[] = [];
  const minValues: Uint8Array[] = [];
  const maxValues: Uint8Array[] = [];
  // A repeated leaf's definition-level count is not a row-level null count.
  // Omit null_counts for those leaves so readers do not interpret entry counts
  // as null counts while still benefiting from min/max page pruning.
  const nullCounts: number[] | undefined = column.rLevelMax === 0 ? [] : undefined;
  for (const plannedPage of plannedPages) {
    const values = plannedPage.data.values;
    const nullCount = plannedPage.data.count - values.length;
    nullCounts?.push(nullCount);
    if (values.length === 0) {
      nullPages.push(true);
      minValues.push(new Uint8Array(0));
      maxValues.push(new Uint8Array(0));
      continue;
    }
    const bounds = getPageBounds(values, column.primitiveType!, column.typeLength);
    if (!bounds) return undefined;
    nullPages.push(false);
    minValues.push(bounds.min);
    maxValues.push(bounds.max);
  }

  return {
    offsetIndex,
    columnIndex: serializeThrift(
      new ColumnIndex({
        null_pages: nullPages,
        min_values: minValues,
        max_values: maxValues,
        boundary_order: BoundaryOrder.UNORDERED,
        null_counts: nullCounts
      })
    )
  };
}

function isPageIndexPhysicalType(
  physicalType: ParquetField['primitiveType']
): physicalType is PageIndexPhysicalType {
  return (
    physicalType === 'BOOLEAN' ||
    physicalType === 'INT32' ||
    physicalType === 'INT64' ||
    physicalType === 'FLOAT' ||
    physicalType === 'DOUBLE' ||
    physicalType === 'BYTE_ARRAY' ||
    physicalType === 'FIXED_LEN_BYTE_ARRAY'
  );
}

type PageIndexPhysicalType =
  | 'BOOLEAN'
  | 'INT32'
  | 'INT64'
  | 'FLOAT'
  | 'DOUBLE'
  | 'BYTE_ARRAY'
  | 'FIXED_LEN_BYTE_ARRAY';

function getPageBounds(
  values: ParquetColumnChunk['values'],
  physicalType: PageIndexPhysicalType,
  typeLength?: number
): {min: Uint8Array; max: Uint8Array} | undefined {
  const normalizedValues = Array.from(values as Iterable<unknown>, value =>
    normalizePageIndexValue(value, physicalType)
  );
  if (normalizedValues.some(value => value === undefined)) return undefined;
  const comparableValues = normalizedValues as Array<
    boolean | number | bigint | string | Uint8Array
  >;
  let min = comparableValues[0];
  let max = comparableValues[0];
  for (const value of comparableValues.slice(1)) {
    if (comparePageIndexValues(value, min, physicalType) < 0) min = value;
    if (comparePageIndexValues(value, max, physicalType) > 0) max = value;
  }
  try {
    return {
      min: encodeParquetBloomFilterValue(min, physicalType, typeLength),
      max: encodeParquetBloomFilterValue(max, physicalType, typeLength)
    };
  } catch {
    return undefined;
  }
}

function normalizePageIndexValue(
  value: unknown,
  physicalType: PageIndexPhysicalType
): boolean | number | bigint | string | Uint8Array | undefined {
  if (physicalType === 'BYTE_ARRAY' || physicalType === 'FIXED_LEN_BYTE_ARRAY') {
    if (typeof value === 'string') return new TextEncoder().encode(value);
    if (value instanceof ArrayBuffer) return new Uint8Array(value);
    if (ArrayBuffer.isView(value)) {
      return new Uint8Array(value.buffer, value.byteOffset, value.byteLength).slice();
    }
    return undefined;
  }
  if (
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'string'
  ) {
    return value;
  }
  return undefined;
}

function comparePageIndexValues(
  left: boolean | number | bigint | string | Uint8Array,
  right: boolean | number | bigint | string | Uint8Array,
  physicalType: PageIndexPhysicalType
): number {
  if (physicalType === 'BYTE_ARRAY' || physicalType === 'FIXED_LEN_BYTE_ARRAY') {
    const leftBytes = typeof left === 'string' ? new TextEncoder().encode(left) : left;
    const rightBytes = typeof right === 'string' ? new TextEncoder().encode(right) : right;
    if (!(leftBytes instanceof Uint8Array) || !(rightBytes instanceof Uint8Array)) return 0;
    const length = Math.min(leftBytes.length, rightBytes.length);
    for (let index = 0; index < length; index++) {
      if (leftBytes[index] !== rightBytes[index]) {
        return leftBytes[index] < rightBytes[index] ? -1 : 1;
      }
    }
    return leftBytes.length - rightBytes.length;
  }
  if (typeof left === 'boolean' && typeof right === 'boolean') return Number(left) - Number(right);
  if (physicalType !== 'INT64') {
    const leftNumber = Number(left);
    const rightNumber = Number(right);
    return leftNumber < rightNumber ? -1 : leftNumber > rightNumber ? 1 : 0;
  }
  try {
    const leftNumber = BigInt(left as number | bigint | string);
    const rightNumber = BigInt(right as number | bigint | string);
    return leftNumber < rightNumber ? -1 : leftNumber > rightNumber ? 1 : 0;
  } catch {
    const leftNumber = Number(left);
    const rightNumber = Number(right);
    return leftNumber < rightNumber ? -1 : leftNumber > rightNumber ? 1 : 0;
  }
}

/** Builds a Bloom filter for writer-supported physical scalar columns. */
function createColumnBloomFilter(
  column: ParquetField,
  values: ParquetColumnChunk['values']
): Uint8Array | undefined {
  const physicalType = column.primitiveType;
  if (
    physicalType !== 'BOOLEAN' &&
    physicalType !== 'INT32' &&
    physicalType !== 'INT64' &&
    physicalType !== 'FLOAT' &&
    physicalType !== 'DOUBLE' &&
    physicalType !== 'BYTE_ARRAY' &&
    physicalType !== 'FIXED_LEN_BYTE_ARRAY'
  ) {
    return undefined;
  }
  const bloomValues = values.map(value => {
    if (value instanceof ArrayBuffer) return new Uint8Array(value);
    if (ArrayBuffer.isView(value)) {
      return new Uint8Array(value.buffer, value.byteOffset, value.byteLength).slice();
    }
    return value;
  });
  return encodeParquetSplitBlockBloomFilter(
    bloomValues as Parameters<typeof encodeParquetSplitBlockBloomFilter>[0],
    physicalType,
    column.typeLength
  );
}

/** Builds optional size statistics from one shredded column chunk. */
function createSizeStatistics(column: ParquetField, data: ParquetColumnChunk): SizeStatistics {
  const repetitionLevelHistogram = createLevelHistogram(data.rlevels, column.rLevelMax);
  const definitionLevelHistogram = createLevelHistogram(data.dlevels, column.dLevelMax);
  let unencodedByteArrayDataBytes = 0;
  if (column.primitiveType === 'BYTE_ARRAY') {
    for (const value of data.values) {
      if (typeof value === 'string') {
        unencodedByteArrayDataBytes += encodeUtf8(value).byteLength;
      } else if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
        unencodedByteArrayDataBytes += value.byteLength;
      }
    }
  }
  return new SizeStatistics({
    unencoded_byte_array_data_bytes:
      column.primitiveType === 'BYTE_ARRAY' ? unencodedByteArrayDataBytes : undefined,
    repetition_level_histogram: repetitionLevelHistogram,
    definition_level_histogram: definitionLevelHistogram
  });
}

/** Returns whether standard column statistics are enabled for one top-level field. */
function isStatisticsEnabled(
  option: boolean | Record<string, boolean> | undefined,
  column: ParquetField
): boolean {
  return option === true || option?.[column.path[0]] === true;
}

/** Builds conservative standard min/max/null-count statistics for one column chunk. */
function createColumnStatistics(
  column: ParquetField,
  data: ParquetColumnChunk
): Statistics | undefined {
  if (
    !column.primitiveType ||
    !isPageIndexPhysicalType(column.primitiveType) ||
    !supportsStatisticsSortOrder(column)
  ) {
    return undefined;
  }
  const statistics = new Statistics({
    null_count: column.rLevelMax === 0 ? data.count - data.values.length : undefined,
    is_min_value_exact: true,
    is_max_value_exact: true
  });
  if (data.values.length === 0) return statistics;
  const bounds = getPageBounds(data.values, column.primitiveType, column.typeLength);
  if (!bounds) return undefined;
  statistics.min_value = bounds.min;
  statistics.max_value = bounds.max;
  return statistics;
}

/** Returns whether the physical representation preserves the logical sort order. */
function supportsStatisticsSortOrder(column: ParquetField): boolean {
  const logicalType = column.logicalType?.type || column.originalType;
  if (logicalType === 'FLOAT16') return false;
  if (logicalType === 'DECIMAL' || logicalType?.startsWith('DECIMAL_')) {
    return column.primitiveType !== 'BYTE_ARRAY' && column.primitiveType !== 'FIXED_LEN_BYTE_ARRAY';
  }
  if (logicalType === 'INTEGER' || logicalType?.startsWith('UINT_')) {
    return column.logicalType?.isSigned !== false && !logicalType.startsWith('UINT_');
  }
  return true;
}

/** Counts the occurrences of each definition or repetition level. */
function createLevelHistogram(
  levels: ParquetColumnChunk['rlevels'],
  maximumLevel: number
): number[] {
  const histogram = new Array<number>(maximumLevel + 1).fill(0);
  for (const level of levels) {
    if (level >= 0 && level <= maximumLevel) histogram[level]++;
  }
  return histogram;
}

/** Converts writer-facing sort keys into Parquet leaf-column indexes. */
function createSortingColumns(
  schema: ParquetSchema,
  sortingColumns: readonly ParquetSortingColumnOption[] | undefined
): SortingColumn[] | undefined {
  if (!sortingColumns?.length) return undefined;
  const leafFields = schema.fieldList.filter(field => !field.isNested);
  const usedColumnIndexes = new Set<number>();
  return sortingColumns.map(sortKey => {
    const columnIndex = leafFields.findIndex(
      field =>
        (field.path.length === 1 && field.name === sortKey.column) ||
        (field.path.length > 1 && field.path.join('.') === sortKey.column)
    );
    if (columnIndex < 0) {
      throw new Error(`Unknown Parquet sorting column ${sortKey.column}`);
    }
    if (usedColumnIndexes.has(columnIndex)) {
      throw new Error(`Duplicate Parquet sorting column ${sortKey.column}`);
    }
    usedColumnIndexes.add(columnIndex);
    return new SortingColumn({
      column_idx: columnIndex,
      descending: Boolean(sortKey.descending),
      nulls_first: Boolean(sortKey.nullsFirst)
    });
  });
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
    total_byte_size: int64(0),
    sorting_columns: createSortingColumns(schema, opts.sortingColumns)
  });

  let body: Uint8Array = new Uint8Array(0);
  for (const field of schema.fieldList) {
    if (field.isNested) {
      continue; // eslint-disable-line no-continue
    }

    const cchunkData = await encodeColumnChunk(field, data, body.length, opts);

    const cchunk = new ColumnChunk({
      file_offset: int64(cchunkData.metadataOffset),
      meta_data: cchunkData.metadata,
      offset_index_offset:
        cchunkData.offsetIndexOffset === undefined
          ? undefined
          : int64(cchunkData.offsetIndexOffset),
      offset_index_length: cchunkData.offsetIndexLength,
      column_index_offset:
        cchunkData.columnIndexOffset === undefined
          ? undefined
          : int64(cchunkData.columnIndexOffset),
      column_index_length: cchunkData.columnIndexLength
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

/** Wraps a serialized footer in Parquet modular-encryption metadata and AES-GCM. */
async function encodeEncryptedFooter(
  footer: Uint8Array,
  options: ParquetWriterEncryptionOptions
): Promise<Uint8Array> {
  const algorithm = options.algorithm ?? 'AES_GCM_V1';
  const fileUnique = options.fileUnique ? new Uint8Array(options.fileUnique) : createFileUnique();
  if (fileUnique.byteLength !== 8) {
    throw new Error(`Parquet encrypted footer file_unique must be 8 bytes`);
  }
  const algorithmParameters = {
    aad_prefix: options.aadPrefix && new Uint8Array(options.aadPrefix),
    aad_file_unique: fileUnique,
    supply_aad_prefix: options.aadPrefix ? true : undefined
  };
  const encryptionAlgorithm =
    algorithm === 'AES_GCM_CTR_V1'
      ? new EncryptionAlgorithm({AES_GCM_CTR_V1: algorithmParameters})
      : new EncryptionAlgorithm({AES_GCM_V1: algorithmParameters});
  const cryptoMetadata = serializeThrift(
    new FileCryptoMetaData({
      encryption_algorithm: encryptionAlgorithm,
      key_metadata: options.keyMetadata && new Uint8Array(options.keyMetadata)
    })
  );
  const footerMetadata = footer.subarray(0, footer.byteLength - 8);
  const encryptedFooter = await encryptParquetModule(footerMetadata, {
    algorithm,
    aad: createParquetModuleAad(options.aadPrefix, fileUnique, 'footer'),
    keyMetadata: options.keyMetadata,
    keyRetriever: options.keyRetriever
  });
  const metadataSize = cryptoMetadata.byteLength + encryptedFooter.byteLength;
  const trailer = new Uint8Array(8);
  writeUInt32LE(trailer, metadataSize, 0);
  trailer.set(encodeUtf8(PARQUET_MAGIC_ENCRYPTED), 4);
  return concatUint8Arrays([cryptoMetadata, encryptedFooter, trailer]);
}

/** Generates the eight-byte file identifier required by Parquet module AAD. */
function createFileUnique(): Uint8Array {
  const fileUnique = new Uint8Array(8);
  const cryptoProvider = globalThis.crypto;
  if (!cryptoProvider?.getRandomValues) {
    throw new Error('Parquet encrypted footer requires Web Crypto random values');
  }
  cryptoProvider.getRandomValues(fileUnique);
  return fileUnique;
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
