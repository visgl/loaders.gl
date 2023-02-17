// Forked from https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.)
import {ParquetSchema} from '../schema/schema';
import {PARQUET_MAGIC, PARQUET_MAGIC_ENCRYPTED} from '../../constants';
import {ColumnChunk, CompressionCodec, FileMetaData, RowGroup, Type} from '../parquet-thrift';
import {
  ParquetBuffer,
  ParquetCompression,
  ParquetData,
  PrimitiveType,
  ParquetOptions
} from '../schema/declare';
import {decodeFileMetadata, getThriftEnum, fieldIndexOf} from '../utils/read-utils';
import {decodeDataPages, decodePage} from './decoders';

const DEFAULT_DICTIONARY_SIZE = 1e6;

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
  public defaultDictionarySize: number;

  static async openBuffer(buffer: Buffer): Promise<ParquetEnvelopeReader> {
    const readFn = (position: number, length: number) =>
      Promise.resolve(buffer.slice(position, position + length));
    const closeFn = () => Promise.resolve();
    return new ParquetEnvelopeReader(readFn, closeFn, buffer.length);
  }

  constructor(
    read: (position: number, length: number) => Promise<Buffer>,
    close: () => Promise<void>,
    fileSize: number,
    options?: any
  ) {
    this.read = read;
    this.close = close;
    this.fileSize = fileSize;
    this.defaultDictionarySize = options?.defaultDictionarySize || DEFAULT_DICTIONARY_SIZE;
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

  /**
   * Do reading of parquet file's column chunk
   * @param schema
   * @param colChunk
   */
  async readColumnChunk(schema: ParquetSchema, colChunk: ColumnChunk): Promise<ParquetData> {
    if (colChunk.file_path !== undefined && colChunk.file_path !== null) {
      throw new Error('external references are not supported');
    }

    const field = schema.findField(colChunk.meta_data?.path_in_schema!);
    const type: PrimitiveType = getThriftEnum(Type, colChunk.meta_data?.type!) as any;

    if (type !== field.primitiveType) {
      throw new Error(`chunk type not matching schema: ${type}`);
    }

    const compression: ParquetCompression = getThriftEnum(
      CompressionCodec,
      colChunk.meta_data?.codec!
    ) as any;

    const pagesOffset = Number(colChunk.meta_data?.data_page_offset!);
    let pagesSize = Number(colChunk.meta_data?.total_compressed_size!);

    if (!colChunk.file_path) {
      pagesSize = Math.min(
        this.fileSize - pagesOffset,
        Number(colChunk.meta_data?.total_compressed_size)
      );
    }

    const options: ParquetOptions = {
      type,
      rLevelMax: field.rLevelMax,
      dLevelMax: field.dLevelMax,
      compression,
      column: field,
      numValues: colChunk.meta_data?.num_values,
      dictionary: []
    };

    let dictionary;

    const dictionaryPageOffset = colChunk?.meta_data?.dictionary_page_offset;

    if (dictionaryPageOffset) {
      const dictionaryOffset = Number(dictionaryPageOffset);
      // Getting dictionary from column chunk to iterate all over indexes to get dataPage values.
      dictionary = await this.getDictionary(dictionaryOffset, options, pagesOffset);
    }

    dictionary = options.dictionary?.length ? options.dictionary : dictionary;
    const pagesBuf = await this.read(pagesOffset, pagesSize);
    return await decodeDataPages(pagesBuf, {...options, dictionary});
  }

  /**
   * Getting dictionary for allows to flatten values by indices.
   * @param dictionaryPageOffset
   * @param options
   * @param pagesOffset
   * @returns
   */
  async getDictionary(
    dictionaryPageOffset: number,
    options: ParquetOptions,
    pagesOffset: number
  ): Promise<string[]> {
    if (dictionaryPageOffset === 0) {
      // dictionarySize = Math.min(this.fileSize - pagesOffset, this.defaultDictionarySize);
      // pagesBuf = await this.read(pagesOffset, dictionarySize);

      // In this case we are working with parquet-mr files format. Problem is described below:
      // https://stackoverflow.com/questions/55225108/why-is-dictionary-page-offset-0-for-plain-dictionary-encoding
      // We need to get dictionary page from column chunk if it exists.
      // Now if we use code commented above we don't get DICTIONARY_PAGE we get DATA_PAGE instead.
      return [];
    }

    const dictionarySize = Math.min(
      this.fileSize - dictionaryPageOffset,
      this.defaultDictionarySize
    );
    const pagesBuf = await this.read(dictionaryPageOffset, dictionarySize);

    const cursor = {buffer: pagesBuf, offset: 0, size: pagesBuf.length};
    const decodedPage = await decodePage(cursor, options);

    return decodedPage.dictionary!;
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
