// Forked from https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.)
/* eslint-disable camelcase */
import {ParquetSchema} from '../schema/schema';
import {WritableFile} from '@loaders.gl/loader-utils';
import {
  PARQUET_RDLVL_TYPE,
  PARQUET_RDLVL_ENCODING,
  PARQUET_MAGIC,
  PARQUET_VERSION
} from '../../constants';
import {ParquetCodecOptions, PARQUET_CODECS} from '../codecs';
import * as Compression from '../compression';
import {
  ParquetBuffer,
  ParquetCodec,
  ParquetData,
  ParquetField,
  PrimitiveType
} from '../schema/declare';
import {
  ColumnChunk,
  ColumnMetaData,
  CompressionCodec,
  ConvertedType,
  DataPageHeader,
  DataPageHeaderV2,
  Encoding,
  FieldRepetitionType,
  FileMetaData,
  KeyValue,
  PageHeader,
  PageType,
  RowGroup,
  SchemaElement,
  Type
} from '../parquet-thrift';

import {getBitWidth, serializeThrift} from '../utils/thrift-utils';
import Int64 from 'node-int64';

export interface ParquetEncoderOptions {
  baseOffset?: number;
  rowGroupSize?: number;
  pageSize?: number;
  useDataPageV2?: boolean;

  // Write Stream Options
  flags?: string;
  encoding?: string;
  fd?: number;
  mode?: number;
  autoClose?: boolean;
  start?: number;
}

const PARQUET_DEFAULT_PAGE_SIZE = 8192;

/**
 * Create a parquet file from a schema and a number of row groups. This class
 * performs direct, unbuffered writes to the underlying output stream and is
 * intendend for advanced and internal users; the writeXXX methods must be
 * called in the correct order to produce a valid file.
 */
export class ParquetEnvelopeWriter {
  public schema: ParquetSchema;
  public file: WritableFile;
  public offset: number;
  public rowCount: number;
  public rowGroups: RowGroup[];
  public pageSize: number;
  public useDataPageV2: boolean;

  constructor(
    schema: ParquetSchema,
    file: WritableFile,
    fileOffset: number,
    opts?: ParquetEncoderOptions
  ) {
    this.schema = schema;
    this.file = file;
    this.offset = fileOffset;
    this.rowCount = 0;
    this.rowGroups = [];
    this.pageSize = opts?.pageSize || PARQUET_DEFAULT_PAGE_SIZE;
    this.useDataPageV2 = opts?.useDataPageV2 || false;
  }

  close() {
    this.file.close();
  }

  writeSection(buf: Buffer): Promise<void> {
    this.offset += buf.length;
    return this.file.write(buf);
  }

  /**
   * Encode the parquet file header
   */
  writeHeader(): Promise<void> {
    return this.writeSection(Buffer.from(PARQUET_MAGIC));
  }

  /**
   * Encode a parquet row group. The records object should be created using the
   * shredRecord method
   */
  async writeRowGroup(records: ParquetBuffer): Promise<void> {
    const rgroup = await encodeRowGroup(this.schema, records, {
      baseOffset: this.offset,
      pageSize: this.pageSize,
      useDataPageV2: this.useDataPageV2
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
  data: ParquetData
): Promise<{
  header: PageHeader;
  headerSize: number;
  page: Buffer;
}> {
  /* encode repetition and definition levels */
  let rLevelsBuf = Buffer.alloc(0);
  if (column.rLevelMax > 0) {
    rLevelsBuf = encodeValues(PARQUET_RDLVL_TYPE, PARQUET_RDLVL_ENCODING, data.rlevels, {
      bitWidth: getBitWidth(column.rLevelMax)
      // disableEnvelope: false
    });
  }

  let dLevelsBuf = Buffer.alloc(0);
  if (column.dLevelMax > 0) {
    dLevelsBuf = encodeValues(PARQUET_RDLVL_TYPE, PARQUET_RDLVL_ENCODING, data.dlevels, {
      bitWidth: getBitWidth(column.dLevelMax)
      // disableEnvelope: false
    });
  }

  /* encode values */
  const valuesBuf = encodeValues(column.primitiveType!, column.encoding!, data.values, {
    typeLength: column.typeLength,
    bitWidth: column.typeLength
  });

  const dataBuf = Buffer.concat([rLevelsBuf, dLevelsBuf, valuesBuf]);

  // compression = column.compression === 'UNCOMPRESSED' ? (compression || 'UNCOMPRESSED') : column.compression;
  const compressedBuf = await Compression.deflate(column.compression!, dataBuf);

  /* build page header */
  const header = new PageHeader({
    type: PageType.DATA_PAGE,
    data_page_header: new DataPageHeader({
      num_values: data.count,
      encoding: Encoding[column.encoding!] as any,
      definition_level_encoding: Encoding[PARQUET_RDLVL_ENCODING], // [PARQUET_RDLVL_ENCODING],
      repetition_level_encoding: Encoding[PARQUET_RDLVL_ENCODING] // [PARQUET_RDLVL_ENCODING]
    }),
    uncompressed_page_size: dataBuf.length,
    compressed_page_size: compressedBuf.length
  });

  /* concat page header, repetition and definition levels and values */
  const headerBuf = serializeThrift(header);
  const page = Buffer.concat([headerBuf, compressedBuf]);

  return {header, headerSize: headerBuf.length, page};
}

/**
 * Encode a parquet data page (v2)
 */
async function encodeDataPageV2(
  column: ParquetField,
  data: ParquetData,
  rowCount: number
): Promise<{
  header: PageHeader;
  headerSize: number;
  page: Buffer;
}> {
  /* encode values */
  const valuesBuf = encodeValues(column.primitiveType!, column.encoding!, data.values, {
    typeLength: column.typeLength,
    bitWidth: column.typeLength
  });

  // compression = column.compression === 'UNCOMPRESSED' ? (compression || 'UNCOMPRESSED') : column.compression;
  const compressedBuf = await Compression.deflate(column.compression!, valuesBuf);

  /* encode repetition and definition levels */
  let rLevelsBuf = Buffer.alloc(0);
  if (column.rLevelMax > 0) {
    rLevelsBuf = encodeValues(PARQUET_RDLVL_TYPE, PARQUET_RDLVL_ENCODING, data.rlevels, {
      bitWidth: getBitWidth(column.rLevelMax),
      disableEnvelope: true
    });
  }

  let dLevelsBuf = Buffer.alloc(0);
  if (column.dLevelMax > 0) {
    dLevelsBuf = encodeValues(PARQUET_RDLVL_TYPE, PARQUET_RDLVL_ENCODING, data.dlevels, {
      bitWidth: getBitWidth(column.dLevelMax),
      disableEnvelope: true
    });
  }

  /* build page header */
  const header = new PageHeader({
    type: PageType.DATA_PAGE_V2,
    data_page_header_v2: new DataPageHeaderV2({
      num_values: data.count,
      num_nulls: data.count - data.values.length,
      num_rows: rowCount,
      encoding: Encoding[column.encoding!] as any,
      definition_levels_byte_length: dLevelsBuf.length,
      repetition_levels_byte_length: rLevelsBuf.length,
      is_compressed: column.compression !== 'UNCOMPRESSED'
    }),
    uncompressed_page_size: rLevelsBuf.length + dLevelsBuf.length + valuesBuf.length,
    compressed_page_size: rLevelsBuf.length + dLevelsBuf.length + compressedBuf.length
  });

  /* concat page header, repetition and definition levels and values */
  const headerBuf = serializeThrift(header);
  const page = Buffer.concat([headerBuf, rLevelsBuf, dLevelsBuf, compressedBuf]);
  return {header, headerSize: headerBuf.length, page};
}

/**
 * Encode an array of values into a parquet column chunk
 */
async function encodeColumnChunk(
  column: ParquetField,
  buffer: ParquetBuffer,
  offset: number,
  opts: ParquetEncoderOptions
): Promise<{
  body: Buffer;
  metadata: ColumnMetaData;
  metadataOffset: number;
}> {
  const data = buffer.columnData[column.path.join()];
  const baseOffset = (opts.baseOffset || 0) + offset;
  /* encode data page(s) */
  // const pages: Buffer[] = [];
  let pageBuf: Buffer;
  // tslint:disable-next-line:variable-name
  let total_uncompressed_size = 0;
  // tslint:disable-next-line:variable-name
  let total_compressed_size = 0;
  {
    const result = opts.useDataPageV2
      ? await encodeDataPageV2(column, data, buffer.rowCount)
      : await encodeDataPage(column, data);
    // pages.push(result.page);
    pageBuf = result.page;
    total_uncompressed_size += result.header.uncompressed_page_size + result.headerSize;
    total_compressed_size += result.header.compressed_page_size + result.headerSize;
  }

  // const pagesBuf = Buffer.concat(pages);
  // const compression = column.compression === 'UNCOMPRESSED' ? (opts.compression || 'UNCOMPRESSED') : column.compression;

  /* prepare metadata header */
  const metadata = new ColumnMetaData({
    path_in_schema: column.path,
    num_values: data.count,
    data_page_offset: baseOffset,
    encodings: [],
    total_uncompressed_size, //  : pagesBuf.length,
    total_compressed_size,
    type: Type[column.primitiveType!],
    codec: CompressionCodec[column.compression!]
  });

  /* list encodings */
  metadata.encodings.push(Encoding[PARQUET_RDLVL_ENCODING]);
  metadata.encodings.push(Encoding[column.encoding!]);

  /* concat metadata header and data pages */
  const metadataOffset = baseOffset + pageBuf.length;
  const body = Buffer.concat([pageBuf, serializeThrift(metadata)]);
  return {body, metadata, metadataOffset};
}

/**
 * Encode a list of column values into a parquet row group
 */
async function encodeRowGroup(
  schema: ParquetSchema,
  data: ParquetBuffer,
  opts: ParquetEncoderOptions
): Promise<{
  body: Buffer;
  metadata: RowGroup;
}> {
  const metadata = new RowGroup({
    num_rows: data.rowCount,
    columns: [],
    total_byte_size: 0
  });

  let body = Buffer.alloc(0);
  for (const field of schema.fieldList) {
    if (field.isNested) {
      continue; // eslint-disable-line no-continue
    }

    const cchunkData = await encodeColumnChunk(field, data, body.length, opts);

    const cchunk = new ColumnChunk({
      file_offset: cchunkData.metadataOffset,
      meta_data: cchunkData.metadata
    });

    metadata.columns.push(cchunk);
    metadata.total_byte_size = new Int64(Number(metadata.total_byte_size) + cchunkData.body.length);

    body = Buffer.concat([body, cchunkData.body]);
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
): Buffer {
  const metadata = new FileMetaData({
    version: PARQUET_VERSION,
    created_by: 'parquets',
    num_rows: rowCount,
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
      schemaElem.converted_type = ConvertedType[field.originalType] as ConvertedType;
    }

    schemaElem.type_length = field.typeLength;

    metadata.schema.push(schemaElem);
  }

  const metadataEncoded = serializeThrift(metadata);
  const footerEncoded = Buffer.alloc(metadataEncoded.length + 8);
  metadataEncoded.copy(footerEncoded);
  footerEncoded.writeUInt32LE(metadataEncoded.length, metadataEncoded.length);
  footerEncoded.write(PARQUET_MAGIC, metadataEncoded.length + 4);
  return footerEncoded;
}
