// Forked from https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.)
import {ParquetSchema} from '../schema/schema';
import {PARQUET_MAGIC, PARQUET_MAGIC_ENCRYPTED} from '../../constants';
import {ColumnChunk, CompressionCodec, FileMetaData, RowGroup, Type} from '../parquet-thrift';
import {ParquetBuffer, ParquetCompression, ParquetData, PrimitiveType} from '../schema/declare';
import {decodeDataPages} from '../utils/decoders';
import {fstat, fopen, fread, fclose} from '../utils/file-utils';
import {decodeFileMetadata, getThriftEnum, fieldIndexOf} from '../utils/read-utils';

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
    const fileStat = await fstat(filePath);
    const fileDescriptor = await fopen(filePath);

    const readFn = fread.bind(undefined, fileDescriptor);
    const closeFn = fclose.bind(undefined, fileDescriptor);

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
    const buffer = await this.read(0, PARQUET_MAGIC.length);

    const magic = buffer.toString();
    switch (magic) {
      case PARQUET_MAGIC:
        break;
      case PARQUET_MAGIC_ENCRYPTED:
        throw new Error('Encrypted parquet file not supported');
      default:
        throw new Error(`Invalid parquet file (magic=${magic})`);
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
      if (columnList.length > 0 && fieldIndexOf(columnList, colKey!) < 0) {
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
    const type: PrimitiveType = getThriftEnum(Type, colChunk.meta_data?.type!) as any;
    if (type !== field.primitiveType) throw new Error(`chunk type not matching schema: ${type}`);

    const compression: ParquetCompression = getThriftEnum(
      CompressionCodec,
      colChunk.meta_data?.codec!
    ) as any;

    const pagesOffset = Number(colChunk.meta_data?.data_page_offset!);
    const pagesSize = Number(colChunk.meta_data?.total_compressed_size!);
    const pagesBuf = await this.read(pagesOffset, pagesSize);

    return await decodeDataPages(pagesBuf, field, compression);
  }

  async readFooter(): Promise<FileMetaData> {
    const trailerLen = PARQUET_MAGIC.length + 4;
    const trailerBuf = await this.read(this.fileSize - trailerLen, trailerLen);

    const magic = trailerBuf.slice(4).toString();
    if (magic !== PARQUET_MAGIC) {
      throw new Error(`Not a valid parquet file (magic="${magic})`);
    }

    const metadataSize = trailerBuf.readUInt32LE(0);
    const metadataOffset = this.fileSize - metadataSize - trailerLen;
    if (metadataOffset < PARQUET_MAGIC.length) {
      throw new Error(`Invalid metadata size ${metadataOffset}`);
    }

    const metadataBuf = await this.read(metadataOffset, metadataSize);
    // let metadata = new parquet_thrift.FileMetaData();
    // parquet_util.decodeThrift(metadata, metadataBuf);
    const {metadata} = decodeFileMetadata(metadataBuf);
    return metadata;
  }
}
