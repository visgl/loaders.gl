// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license

import type {ReadableFile} from '@loaders.gl/loader-utils';

import {ParquetSchema} from '../schema/schema';
import {decodeSchema, decodeDataPages, decodePage} from './decoders';
import {materializeRows} from '../schema/shred';

import {PARQUET_MAGIC, PARQUET_MAGIC_ENCRYPTED} from '../../lib/constants';
import {ColumnChunk, CompressionCodec, FileMetaData, RowGroup, Type} from '../parquet-thrift/index';
import {
  ParquetRowGroup,
  ParquetCompression,
  ParquetColumnChunk,
  PrimitiveType,
  ParquetReaderContext,
  type ParquetLevelBuffer
} from '../schema/declare';
import {decodeFileMetadata, getThriftEnum, fieldIndexOf} from '../utils/read-utils';
import {decodeString, readUInt32LE, toUint8Array} from '../utils/binary-utils';
import {CompactInt64} from '../utils/uint8-array-compact-protocol';
import type {
  ParquetDataPageLocation,
  ParquetPageLocations,
  ParquetRowRange
} from '../../lib/parquet-page-index';

/** Bounds concurrent range requests when a row group contains unusually many selected columns. */
const MAXIMUM_CONCURRENT_COLUMN_READS = 16;

export type ParquetReaderProps = {
  /** Maximum dictionary-page read size. */
  defaultDictionarySize?: number;
  /** Preserve BYTE_ARRAY values instead of decoding them as strings. */
  preserveBinary?: boolean;
  /** Retain byte arrays as views into decoded page buffers for direct materialization. */
  retainByteArrayViews?: boolean;
  /** Decode supported primitive columns into typed buffers instead of boxed JavaScript arrays. */
  useTypedValueBuffers?: boolean;
  /** Decode repetition and definition levels into compact unsigned typed arrays. */
  useTypedLevelBuffers?: boolean;
  /** Verify page-header CRC values when present. Disabled by default for throughput. */
  verifyPageChecksums?: boolean;
  /** Abort signal forwarded to every underlying random-access read. */
  signal?: AbortSignal;
};

/** Properties for initializing a ParquetRowGroupReader */
export type ParquetIterationProps = {
  /** Filter allowing some columns to be dropped */
  columnList?: string[] | string[][];
  /** Zero-based row-group indexes to read, in output order. */
  rowGroups?: number[];
  /** Abort signal forwarded to row-group and column-chunk reads. */
  signal?: AbortSignal;
};

/**
 * The parquet envelope reader allows direct, unbuffered access to the individual
 * sections of the parquet file, namely the header, footer and the row groups.
 * This class is intended for advanced/internal users; if you just want to retrieve
 * rows from a parquet file use the ParquetReader instead
 */
export class ParquetReader {
  static defaultProps: Required<Omit<ParquetReaderProps, 'signal'>> & {signal?: AbortSignal} = {
    // max ArrayBuffer size in js is 2Gb
    defaultDictionarySize: 2147483648,
    preserveBinary: false,
    retainByteArrayViews: false,
    useTypedValueBuffers: false,
    useTypedLevelBuffers: false,
    verifyPageChecksums: false,
    signal: undefined
  };

  props: Required<Omit<ParquetReaderProps, 'signal'>> & {signal?: AbortSignal};
  file: ReadableFile;
  metadata: Promise<FileMetaData> | null = null;
  /** Parsed Parquet schema shared by metadata, iteration, and materialization paths. */
  private schema: Promise<ParquetSchema> | null = null;

  constructor(file: ReadableFile, props?: ParquetReaderProps) {
    this.file = file;
    this.props = {...ParquetReader.defaultProps, ...props};
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
      yield materializeRows(schema, rowGroup);
    }
  }

  /** Iterate over the raw row groups */
  async *rowGroupIterator(props?: ParquetIterationProps) {
    // Ensure strings are nested in arrays
    const columnList: string[][] = (props?.columnList || []).map(x => (Array.isArray(x) ? x : [x]));

    const metadata = await this.getFileMetadata(props?.signal);
    const schema = await this.getSchema(props?.signal);

    const rowGroupCount = metadata?.row_groups.length || 0;
    const rowGroupIndices =
      props?.rowGroups || Array.from({length: rowGroupCount}, (_, index) => index);

    for (const rowGroupIndex of rowGroupIndices) {
      if (!Number.isInteger(rowGroupIndex) || rowGroupIndex < 0 || rowGroupIndex >= rowGroupCount) {
        throw new Error(`Invalid Parquet row-group index ${rowGroupIndex}`);
      }
      const rowGroup = await this.readRowGroup(
        schema,
        metadata.row_groups[rowGroupIndex],
        columnList,
        props?.signal
      );
      yield rowGroup;
    }
  }

  async getRowCount(signal?: AbortSignal): Promise<number> {
    const metadata = await this.getFileMetadata(signal);
    return Number(metadata.num_rows);
  }

  async getSchema(signal?: AbortSignal): Promise<ParquetSchema> {
    this.schema ||= this.getFileMetadata(signal).then(metadata => {
      const root = metadata.schema[0];
      const {schema: schemaDefinition} = decodeSchema(metadata.schema, 1, root.num_children!);
      return new ParquetSchema(schemaDefinition);
    });
    return await this.schema;
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

  async getFileMetadata(signal?: AbortSignal): Promise<FileMetaData> {
    if (!this.metadata) {
      await this.readHeader(signal);
      this.metadata = this.readFooter(signal);
    }
    return this.metadata;
  }

  // LOW LEVEL METHODS

  /** Metadata is stored in the footer */
  async readHeader(signal?: AbortSignal): Promise<void> {
    const arrayBuffer = await this.file.read(0, PARQUET_MAGIC.length, signal ?? this.props.signal);
    const magic = decodeString(toUint8Array(arrayBuffer));
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
  async readFooter(signal?: AbortSignal): Promise<FileMetaData> {
    const trailerLen = PARQUET_MAGIC.length + 4;
    const arrayBuffer = await this.file.read(
      this.file.size - trailerLen,
      trailerLen,
      signal ?? this.props.signal
    );
    const trailer = toUint8Array(arrayBuffer);

    const magic = decodeString(trailer, 4);
    if (magic !== PARQUET_MAGIC) {
      throw new Error(`Not a valid parquet file (magic="${magic})`);
    }

    const metadataSize = readUInt32LE(trailer, 0);
    const metadataOffset = this.file.size - metadataSize - trailerLen;
    if (metadataOffset < PARQUET_MAGIC.length) {
      throw new Error(`Invalid metadata size ${metadataOffset}`);
    }

    const arrayBuffer2 = await this.file.read(
      metadataOffset,
      metadataSize,
      signal ?? this.props.signal
    );
    const metadataBuf = toUint8Array(arrayBuffer2);
    // let metadata = new parquet_thrift.FileMetaData();
    // parquet_util.decodeThrift(metadata, metadataBuf);

    const {metadata} = decodeFileMetadata(metadataBuf);
    return metadata;
  }

  /** Data is stored in row groups (similar to Apache Arrow record batches) */
  async readRowGroup(
    schema: ParquetSchema,
    rowGroup: RowGroup,
    columnList: string[][],
    signal?: AbortSignal
  ): Promise<ParquetRowGroup> {
    const selectedColumnChunks = rowGroup.columns.filter(columnChunk => {
      const columnKey = columnChunk.meta_data?.path_in_schema;
      return columnList.length === 0 || fieldIndexOf(columnList, columnKey!) >= 0;
    });
    const columnEntries: Array<readonly [string, ParquetColumnChunk]> = [];
    for (
      let batchStart = 0;
      batchStart < selectedColumnChunks.length;
      batchStart += MAXIMUM_CONCURRENT_COLUMN_READS
    ) {
      const columnBatch = selectedColumnChunks.slice(
        batchStart,
        batchStart + MAXIMUM_CONCURRENT_COLUMN_READS
      );
      columnEntries.push(
        ...(await Promise.all(
          columnBatch.map(async columnChunk => {
            const columnKey = columnChunk.meta_data!.path_in_schema.join();
            const columnData = await this.readColumnChunk(schema, columnChunk, signal);
            return [columnKey, columnData] as const;
          })
        ))
      );
    }
    return {
      rowCount: Number(rowGroup.num_rows),
      columnData: Object.fromEntries(columnEntries)
    };
  }

  /** Reads independently materializable non-repeated columns for one row range using page indexes. */
  async readRowGroupRange(
    schema: ParquetSchema,
    rowGroup: RowGroup,
    columnList: string[][],
    rowRange: ParquetRowRange,
    pageLocations: ParquetPageLocations,
    signal?: AbortSignal
  ): Promise<ParquetRowGroup> {
    const selectedColumnChunks = rowGroup.columns.filter(columnChunk => {
      const columnKey = columnChunk.meta_data?.path_in_schema;
      return columnList.length === 0 || fieldIndexOf(columnList, columnKey!) >= 0;
    });
    const columnEntries = await Promise.all(
      selectedColumnChunks.map(async columnChunk => {
        const columnKey = columnChunk.meta_data!.path_in_schema.join();
        const pages = pageLocations[JSON.stringify(columnChunk.meta_data!.path_in_schema)];
        if (!pages) {
          throw new Error(`Parquet offset index missing for ${columnKey}`);
        }
        const columnData = await this.readColumnChunkRange(
          schema,
          columnChunk,
          rowRange,
          pages,
          signal
        );
        return [columnKey, columnData] as const;
      })
    );
    return {
      rowCount: rowRange.end - rowRange.start,
      columnData: Object.fromEntries(columnEntries)
    };
  }

  /**
   * Each row group contains column chunks for all the columns.
   */
  async readColumnChunk(
    schema: ParquetSchema,
    colChunk: ColumnChunk,
    signal?: AbortSignal
  ): Promise<ParquetColumnChunk> {
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
    const dictionaryPageOffset = colChunk.meta_data?.dictionary_page_offset;
    const validDictionaryPageOffset =
      dictionaryPageOffset !== undefined && Number(dictionaryPageOffset) > 0
        ? Number(dictionaryPageOffset)
        : undefined;
    const chunkOffset = Math.min(pagesOffset, validDictionaryPageOffset ?? pagesOffset);
    const chunkEnd = chunkOffset + Number(colChunk.meta_data?.total_compressed_size!);
    const chunkSize = Math.min(this.file.size - chunkOffset, Math.max(0, chunkEnd - chunkOffset));
    const arrayBuffer = await this.file.read(chunkOffset, chunkSize, signal ?? this.props.signal);
    const chunkBuffer = toUint8Array(arrayBuffer);
    const pagesRelativeOffset = pagesOffset - chunkOffset;
    const pagesSize = Math.min(
      chunkBuffer.length - pagesRelativeOffset,
      Math.max(0, chunkEnd - pagesOffset)
    );

    const context: ParquetReaderContext = {
      type,
      rLevelMax: field.rLevelMax,
      dLevelMax: field.dLevelMax,
      compression,
      column: field,
      numValues: colChunk.meta_data?.num_values,
      dictionary: [],
      // Options - TBD is this the right place for these?
      preserveBinary: this.props.preserveBinary,
      retainByteArrayViews: this.props.retainByteArrayViews,
      useTypedValueBuffers: this.props.useTypedValueBuffers,
      useTypedLevelBuffers: this.props.useTypedLevelBuffers,
      verifyPageChecksums: this.props.verifyPageChecksums
    };

    let dictionary: any[] | undefined;

    if (validDictionaryPageOffset !== undefined) {
      const dictionaryRelativeOffset = validDictionaryPageOffset - chunkOffset;
      const dictionarySize = Math.min(
        Math.max(0, pagesOffset - validDictionaryPageOffset),
        chunkBuffer.length - dictionaryRelativeOffset,
        this.props.defaultDictionarySize
      );
      const dictionaryBuffer = chunkBuffer.subarray(
        dictionaryRelativeOffset,
        dictionaryRelativeOffset + dictionarySize
      );
      dictionary = await decodeDictionaryBuffer(dictionaryBuffer, context);
    }

    dictionary = context.dictionary?.length ? context.dictionary : dictionary;
    const pagesBuf = chunkBuffer.subarray(pagesRelativeOffset, pagesRelativeOffset + pagesSize);
    return await decodeDataPages(pagesBuf, {...context, dictionary});
  }

  /** Reads and decodes contiguous data pages that begin and end on complete row boundaries. */
  async readColumnChunkRange(
    schema: ParquetSchema,
    columnChunk: ColumnChunk,
    rowRange: ParquetRowRange,
    pages: readonly ParquetDataPageLocation[],
    signal?: AbortSignal
  ): Promise<ParquetColumnChunk> {
    if (columnChunk.file_path !== undefined && columnChunk.file_path !== null) {
      throw new Error('external references are not supported');
    }
    const columnMetadata = columnChunk.meta_data!;
    const field = schema.findField(columnMetadata.path_in_schema);
    const type: PrimitiveType = getThriftEnum(Type, columnMetadata.type) as any;
    if (type !== field.primitiveType) {
      throw new Error(`chunk type not matching schema: ${type}`);
    }
    const compression: ParquetCompression = getThriftEnum(
      CompressionCodec,
      columnMetadata.codec
    ) as any;
    const overlappingPages = pages.filter(
      page => page.endRowIndex > rowRange.start && page.firstRowIndex < rowRange.end
    );
    if (!overlappingPages.length) {
      throw new Error('Parquet page plan does not overlap the requested row range');
    }
    let firstPageIndex = pages.indexOf(overlappingPages[0]);
    const lastPage = overlappingPages[overlappingPages.length - 1];
    let firstPage = pages[firstPageIndex];
    const context: ParquetReaderContext = {
      type,
      rLevelMax: field.rLevelMax,
      dLevelMax: field.dLevelMax,
      compression,
      column: field,
      // Repeated leaves have one level entry per physical value, not one per logical row. Let the
      // page decoder consume the selected page range and preserve all repetition levels.
      numValues:
        field.rLevelMax === 0
          ? new CompactInt64(lastPage.endRowIndex - firstPage.firstRowIndex)
          : undefined,
      dictionary: [],
      preserveBinary: this.props.preserveBinary,
      retainByteArrayViews: this.props.retainByteArrayViews,
      useTypedValueBuffers: this.props.useTypedValueBuffers,
      verifyPageChecksums: this.props.verifyPageChecksums
    };

    let dictionary: any[] | undefined;
    const dictionaryPageOffset = Number(columnMetadata.dictionary_page_offset);
    if (Number.isSafeInteger(dictionaryPageOffset) && dictionaryPageOffset > 0) {
      const dictionaryLength = Math.max(0, pages[0].offset - dictionaryPageOffset);
      const dictionaryBuffer = toUint8Array(
        await this.file.read(dictionaryPageOffset, dictionaryLength, signal ?? this.props.signal)
      );
      dictionary = await decodeDictionaryBuffer(dictionaryBuffer, context);
    }

    let decoded: ParquetColumnChunk;
    while (true) {
      const dataLength = lastPage.offset + lastPage.compressedByteLength - firstPage.offset;
      const dataBuffer = toUint8Array(
        await this.file.read(firstPage.offset, dataLength, signal ?? this.props.signal)
      );
      decoded = await decodeDataPages(dataBuffer, {...context, dictionary});
      if (field.rLevelMax === 0 || decoded.rlevels[0] === 0 || firstPageIndex === 0) {
        break;
      }
      // An offset-index page can begin with continuation levels for a row that started on the
      // preceding page. Include earlier pages until the selected byte range starts at a row.
      firstPage = pages[--firstPageIndex];
    }
    if (field.rLevelMax !== 0) {
      const rowStart = rowRange.start - firstPage.firstRowIndex;
      return sliceRepeatedColumnChunk(
        decoded,
        Math.max(0, rowStart),
        rowRange.end - rowRange.start,
        field.dLevelMax
      );
    }
    const relativeStart = rowRange.start - firstPage.firstRowIndex;
    const relativeEnd = relativeStart + rowRange.end - rowRange.start;
    return sliceNonRepeatedColumnChunk(decoded, field.dLevelMax, relativeStart, relativeEnd);
  }

  /**
   * Getting dictionary for allows to flatten values by indices.
   * @param dictionaryPageOffset
   * @param context
   * @param pagesOffset
   * @returns
   */
  async getDictionary(
    dictionaryPageOffset: number,
    context: ParquetReaderContext,
    pagesOffset: number,
    signal?: AbortSignal
  ): Promise<any[]> {
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
      Math.max(0, pagesOffset - dictionaryPageOffset),
      this.file.size - dictionaryPageOffset,
      this.props.defaultDictionarySize
    );
    const arrayBuffer = await this.file.read(
      dictionaryPageOffset,
      dictionarySize,
      signal ?? this.props.signal
    );
    const pagesBuf = toUint8Array(arrayBuffer);
    return await decodeDictionaryBuffer(pagesBuf, context);
  }
}

/** Decodes one dictionary page from an already-read column-chunk range. */
async function decodeDictionaryBuffer(
  dictionaryBuffer: Uint8Array,
  context: ParquetReaderContext
): Promise<any[]> {
  const cursor = {buffer: dictionaryBuffer, offset: 0, size: dictionaryBuffer.length};
  const decodedPage = await decodePage(cursor, context);
  return decodedPage.dictionary!;
}

/** Slices one decoded non-repeated column chunk while preserving optional-value alignment. */
function sliceNonRepeatedColumnChunk(
  columnChunk: ParquetColumnChunk,
  definitionLevelMaximum: number,
  start: number,
  end: number
): ParquetColumnChunk {
  const valueStart = countDefinedValues(columnChunk.dlevels, definitionLevelMaximum, 0, start);
  const valueEnd =
    valueStart + countDefinedValues(columnChunk.dlevels, definitionLevelMaximum, start, end);
  return {
    rlevels: columnChunk.rlevels.slice(start, end),
    dlevels: columnChunk.dlevels.slice(start, end),
    values: columnChunk.values.slice(valueStart, valueEnd) as typeof columnChunk.values,
    count: end - start,
    pageHeaders: columnChunk.pageHeaders
  };
}

/** Slices a repeated column by logical rows while preserving its level/value alignment. */
function sliceRepeatedColumnChunk(
  columnChunk: ParquetColumnChunk,
  rowStart: number,
  rowCount: number,
  definitionLevelMaximum: number
): ParquetColumnChunk {
  const rowStarts: number[] = [];
  for (let levelIndex = 0; levelIndex < columnChunk.rlevels.length; levelIndex++) {
    if (columnChunk.rlevels[levelIndex] === 0) {
      rowStarts.push(levelIndex);
    }
  }
  const levelStart = rowStarts[rowStart];
  const endRow = rowStart + rowCount;
  const levelEnd = rowStarts[endRow] ?? columnChunk.rlevels.length;
  if (levelStart === undefined || endRow > rowStarts.length || levelEnd < levelStart) {
    throw new Error('Parquet repeated page range does not contain the requested rows');
  }
  const valueStart = countDefinedValues(columnChunk.dlevels, definitionLevelMaximum, 0, levelStart);
  const valueEnd =
    valueStart +
    countDefinedValues(columnChunk.dlevels, definitionLevelMaximum, levelStart, levelEnd);
  return {
    rlevels: columnChunk.rlevels.slice(levelStart, levelEnd),
    dlevels: columnChunk.dlevels.slice(levelStart, levelEnd),
    values: columnChunk.values.slice(valueStart, valueEnd) as typeof columnChunk.values,
    count: levelEnd - levelStart,
    pageHeaders: columnChunk.pageHeaders
  };
}

/** Counts defined primitive values represented by one non-repeated level interval. */
function countDefinedValues(
  definitionLevels: ParquetLevelBuffer,
  definitionLevelMaximum: number,
  start: number,
  end: number
): number {
  let count = 0;
  for (let index = start; index < Math.min(end, definitionLevels.length); index++) {
    if (definitionLevels[index] === definitionLevelMaximum) {
      count++;
    }
  }
  return count;
}
