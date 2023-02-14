// Forked from https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.)
import type {ReadableFile} from '@loaders.gl/loader-utils';

import {ParquetSchema} from '../schema/schema';
import {decodeSchema} from './decoders';
import {materializeRecords} from '../schema/shred';

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

export type ParquetReaderProps = {
  defaultDictionarySize?: number;
};

/** Properties for initializing a ParquetRowGroupReader */
export type ParquetIterationProps = {
  /** Filter allowing some columns to be dropped */
  columnList?: string[] | string[][];
};

const DEFAULT_PROPS: Required<ParquetReaderProps> = {
  defaultDictionarySize: 1e6
};

/**
 * The parquet envelope reader allows direct, unbuffered access to the individual
 * sections of the parquet file, namely the header, footer and the row groups.
 * This class is intended for advanced/internal users; if you just want to retrieve
 * rows from a parquet file use the ParquetReader instead
 */
export class ParquetReader {
  props: Required<ParquetReaderProps>;
  file: ReadableFile;
  metadata: Promise<FileMetaData> | null = null;

  constructor(file: ReadableFile, props?: ParquetReaderProps) {
    this.file = file;
    this.props = {...DEFAULT_PROPS, ...props};
  }

  close(): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.file.close();
  }

  // HIGH LEVEL METHODS

  /** Yield one row at a time */
  async *rowIterator(props?: ParquetIterationProps) {
    for await (const rows of this.rowBatchIterator(props)) {
      // yield *rows
      for (const row of rows) {
        yield row;
      }
    }
  }

  /** Yield one batch of rows at a time */
  async *rowBatchIterator(props?: ParquetIterationProps) {
    const schema = await this.getSchema();
    for await (const rowGroup of this.rowGroupIterator(props)) {
      yield materializeRecords(schema, rowGroup);
    }
  }

  /** Iterate over the raw row groups */
  async *rowGroupIterator(props?: ParquetIterationProps) {
    // Ensure strings are nested in arrays
    const columnList: string[][] = (props?.columnList || []).map((x) =>
      Array.isArray(x) ? x : [x]
    );

    const metadata = await this.getFileMetadata();
    const schema = await this.getSchema();

    const rowGroupCount = metadata?.row_groups.length || 0;

    for (let rowGroupIndex = 0; rowGroupIndex < rowGroupCount; rowGroupIndex++) {
      const rowGroup = await this.readRowGroup(
        schema,
        metadata.row_groups[rowGroupIndex],
        columnList
      );
      yield rowGroup;
    }
  }

  async getRowCount(): Promise<number> {
    const metadata = await this.getFileMetadata();
    return Number(metadata.num_rows);
  }

  async getSchema(): Promise<ParquetSchema> {
    const metadata = await this.getFileMetadata();
    const root = metadata.schema[0];
    const {schema: schemaDefinition} = decodeSchema(metadata.schema, 1, root.num_children!);
    const schema = new ParquetSchema(schemaDefinition);
    return schema;
  }

  /**
   * Returns the user (key/value) metadata for this file
   * In parquet this is not stored on the schema like it is in arrow
   */
  async getSchemaMetadata(): Promise<Record<string, string>> {
    const metadata = await this.getFileMetadata();
    const md: Record<string, string> = {};
    for (const kv of metadata.key_value_metadata!) {
      md[kv.key] = kv.value!;
    }
    return md;
  }

  async getFileMetadata(): Promise<FileMetaData> {
    if (!this.metadata) {
      await this.readHeader();
      this.metadata = this.readFooter();
    }
    return this.metadata;
  }

  // LOW LEVEL METHODS

  /** Metadata is stored in the footer */
  async readHeader(): Promise<void> {
    const buffer = await this.file.read(0, PARQUET_MAGIC.length);
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

  /** Metadata is stored in the footer */
  async readFooter(): Promise<FileMetaData> {
    const trailerLen = PARQUET_MAGIC.length + 4;
    const trailerBuf = await this.file.read(this.file.size - trailerLen, trailerLen);

    const magic = trailerBuf.slice(4).toString();
    if (magic !== PARQUET_MAGIC) {
      throw new Error(`Not a valid parquet file (magic="${magic})`);
    }

    const metadataSize = trailerBuf.readUInt32LE(0);
    const metadataOffset = this.file.size - metadataSize - trailerLen;
    if (metadataOffset < PARQUET_MAGIC.length) {
      throw new Error(`Invalid metadata size ${metadataOffset}`);
    }

    const metadataBuf = await this.file.read(metadataOffset, metadataSize);
    // let metadata = new parquet_thrift.FileMetaData();
    // parquet_util.decodeThrift(metadata, metadataBuf);
    const {metadata} = decodeFileMetadata(metadataBuf);
    return metadata;
  }

  /** Data is stored in row groups (similar to Apache Arrow record batches) */
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
   * Each row group contains column chunks for all the columns.
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
        this.file.size - pagesOffset,
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
    const pagesBuf = await this.file.read(pagesOffset, pagesSize);
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
      this.file.size - dictionaryPageOffset,
      this.props.defaultDictionarySize
    );
    const pagesBuf = await this.file.read(dictionaryPageOffset, dictionarySize);

    const cursor = {buffer: pagesBuf, offset: 0, size: pagesBuf.length};
    const decodedPage = await decodePage(cursor, options);

    return decodedPage.dictionary!;
  }
}
