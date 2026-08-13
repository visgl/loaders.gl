// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DehydratedArrowTable, SplitArrowBuffersOptions} from '@loaders.gl/arrow';
import {dehydrateArrowTable} from '@loaders.gl/arrow';
import type {Loader, ReadableFile, Stat, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import {canParseWithWorker, parseWithWorker} from '@loaders.gl/loader-utils';
import type {ArrayType, Schema} from '@loaders.gl/schema';
import {convertTable} from '@loaders.gl/schema-utils';

import {PARQUET_LOADER_BASE} from '../parquet-loader-base';
import {PARQUET_SOURCE_WORKER_URL} from '../parquet-source-worker-url';
import {preloadCompressions} from '../parquetjs/compression';
import type {RowGroup} from '../parquetjs/parquet-thrift/index';
import {ParquetReader} from '../parquetjs/parser/parquet-reader';
import type {SchemaDefinition} from '../parquetjs/schema/declare';
import {ParquetSchema} from '../parquetjs/schema/schema';

/** Discriminator for a selective Parquet source worker job. */
export const PARQUET_SOURCE_WORKER_OPERATION = 'decode-parquet-source-row-group';

/** One transferable range containing a selected Parquet column chunk. */
export type ParquetSourceWorkerRange = {
  /** Absolute byte offset of this range in the source object. */
  offset: number;
  /** Exact selected bytes transferred to the worker. */
  data: ArrayBuffer;
};

/** Serializable metadata required to decode one selected Parquet column chunk. */
export type ParquetSourceWorkerColumnChunk = {
  /** Optional external file path declared by the column chunk. */
  filePath?: string;
  /** Numeric Parquet physical type. */
  physicalType: number;
  /** Numeric Parquet compression codec. */
  compressionCodec: number;
  /** Nested path in the Parquet schema. */
  path: string[];
  /** Encoded value count. */
  valueCount: number;
  /** Compressed byte length of the complete column chunk. */
  compressedByteLength: number;
  /** Uncompressed byte length declared by the column chunk. */
  uncompressedByteLength: number;
  /** Absolute offset of the first data page. */
  dataPageOffset: number;
  /** Absolute offset of the dictionary page, when present. */
  dictionaryPageOffset?: number;
};

/** Transferable input for one worker-backed Parquet source row-group decode. */
export type ParquetSourceWorkerInput = {
  /** Worker operation discriminator. */
  operation: typeof PARQUET_SOURCE_WORKER_OPERATION;
  /** Total source byte length used to validate virtual file reads. */
  fileByteLength: number;
  /** Logical row count in the selected row group. */
  rowCount: number;
  /** Total uncompressed byte length declared by the row group. */
  uncompressedByteLength: number;
  /** TypeScript decoder schema definition cached from the footer. */
  schemaDefinition: SchemaDefinition;
  /** Projected loaders.gl schema used for Arrow conversion. */
  projectedSchema: Schema;
  /** Selected column chunks represented without Thrift class instances. */
  columnChunks: ParquetSourceWorkerColumnChunk[];
  /** Selected compressed ranges transferred from the main thread. */
  ranges: ParquetSourceWorkerRange[];
  /** Maximum rows per returned Arrow table batch. */
  batchSize: number;
  /** Whether BYTE_ARRAY values stay binary during logical conversion. */
  preserveBinary: boolean;
  /** Arrow buffer copy policy applied before transferring worker output. */
  workerTransferBufferCopy?: SplitArrowBuffersOptions['copy'];
};

/** One directly transferable Arrow batch decoded by a Parquet source worker. */
export type ParquetSourceWorkerBatch = {
  /** Logical offset of this batch within its row group. */
  rowGroupRowOffset: number;
  /** Logical rows in this batch. */
  rowCount: number;
  /** Dehydrated Arrow table whose primitive buffers are directly transferable. */
  arrowTable: DehydratedArrowTable;
};

/** Result returned by one worker-backed Parquet source row-group decode. */
export type ParquetSourceWorkerResult = {
  /** Logical row count in the decoded row group. */
  rowCount: number;
  /** Directly transferable Arrow batches produced in row order. */
  batches: ParquetSourceWorkerBatch[];
  /** Worker time spent decompressing, decoding, and materializing columns. */
  decodeDurationMs: number;
  /** Worker time spent converting columns and preparing transferable Arrow buffers. */
  arrowConversionDurationMs: number;
};

/** Worker options used by selective Parquet source jobs. */
export type ParquetSourceWorkerOptions = StrictLoaderOptions & {
  /** Parquet worker URL and cancellation controls. */
  parquet?: {
    /** Overrides the package-local Parquet worker asset. */
    workerUrl?: string;
    /** Terminates active worker jobs when aborted. */
    signal?: AbortSignal;
  };
};

/** Private worker descriptor using the package-local selective source worker bundle. */
const PARQUET_SOURCE_WORKER: Loader = {
  ...PARQUET_LOADER_BASE,
  id: 'parquet-source',
  name: 'ParquetSource',
  worker: PARQUET_SOURCE_WORKER_URL
};

/** Returns whether this runtime and option set can decode Parquet source rows on a worker. */
export function canDecodeParquetSourceOnWorker(options: ParquetSourceWorkerOptions): boolean {
  return canParseWithWorker(PARQUET_SOURCE_WORKER, options);
}

/** Sends selected compressed Parquet chunks to a worker and returns transferable Arrow buffers. */
export async function decodeParquetSourceRowGroupOnWorker(
  input: ParquetSourceWorkerInput,
  options: ParquetSourceWorkerOptions
): Promise<ParquetSourceWorkerResult> {
  return (await parseWithWorker(
    PARQUET_SOURCE_WORKER,
    input,
    options
  )) as ParquetSourceWorkerResult;
}

/** Returns true when a worker input requests selective Parquet source decoding. */
export function isParquetSourceWorkerInput(input: unknown): input is ParquetSourceWorkerInput {
  return Boolean(
    input &&
      typeof input === 'object' &&
      (input as {operation?: unknown}).operation === PARQUET_SOURCE_WORKER_OPERATION
  );
}

/** Decodes one transferred row group entirely inside the worker. */
export async function decodeParquetSourceWorkerInput(
  input: ParquetSourceWorkerInput
): Promise<ParquetSourceWorkerResult> {
  await preloadCompressions();
  const file = new ParquetSourceWorkerFile(input.fileByteLength, input.ranges);
  const schema = new ParquetSchema(input.schemaDefinition);
  const reader = new ParquetReader(file, {preserveBinary: input.preserveBinary});
  const rowGroup = createWorkerRowGroup(input);

  const decodeStartTime = getCurrentTime();
  const decodedRowGroup = await reader.readRowGroup(schema, rowGroup, []);
  const columns = schema.materializeColumns(decodedRowGroup);
  const decodeDurationMs = getCurrentTime() - decodeStartTime;

  const conversionStartTime = getCurrentTime();
  const batches: ParquetSourceWorkerBatch[] = [];
  for (
    let rowGroupRowOffset = 0;
    rowGroupRowOffset < input.rowCount;
    rowGroupRowOffset += input.batchSize
  ) {
    const rowCount = Math.min(input.batchSize, input.rowCount - rowGroupRowOffset);
    const batchColumns = sliceColumns(columns, rowGroupRowOffset, rowGroupRowOffset + rowCount);
    const arrowTable = convertTable(
      {
        shape: 'columnar-table',
        schema: input.projectedSchema,
        data: batchColumns
      },
      'arrow-table'
    );
    batches.push({
      rowGroupRowOffset,
      rowCount,
      arrowTable: dehydrateArrowTable(arrowTable.data, {
        copy: input.workerTransferBufferCopy
      })
    });
  }
  const arrowConversionDurationMs = getCurrentTime() - conversionStartTime;
  return {rowCount: input.rowCount, batches, decodeDurationMs, arrowConversionDurationMs};
}

/** Readable file backed only by selected transferred ranges from the source object. */
class ParquetSourceWorkerFile implements ReadableFile {
  /** Synthetic worker-local file handle. */
  readonly handle = 'parquet-source-worker';
  /** Synthetic worker-local URL. */
  readonly url = '';
  /** Total source byte length. */
  readonly size: number;
  /** Total source byte length as a bigint. */
  readonly bigsize: bigint;
  /** Selected ranges available to decoder reads. */
  private readonly ranges: ParquetSourceWorkerRange[];

  /** Creates a virtual file over transferred selected ranges. */
  constructor(fileByteLength: number, ranges: ParquetSourceWorkerRange[]) {
    this.size = fileByteLength;
    this.bigsize = BigInt(fileByteLength);
    this.ranges = ranges;
  }

  /** Releases this no-op worker-local virtual file. */
  async close(): Promise<void> {}

  /** Returns the original source byte length. */
  async stat(): Promise<Stat> {
    return {size: this.size, bigsize: this.bigsize, isDirectory: false};
  }

  /** Reads one decoder-requested slice from a transferred selected range. */
  async read(
    start: number | bigint = 0,
    length: number = this.size - Number(start)
  ): Promise<ArrayBuffer> {
    const offset = Number(start);
    const range = this.ranges.find(
      candidate =>
        offset >= candidate.offset &&
        offset + length <= candidate.offset + candidate.data.byteLength
    );
    if (!range) {
      throw new Error(
        `Parquet worker requested unavailable byte range ${offset}-${offset + length - 1}`
      );
    }
    const relativeOffset = offset - range.offset;
    return range.data.slice(relativeOffset, relativeOffset + length);
  }
}

/** Reconstructs the minimal Thrift-compatible row-group object used by the decoder. */
function createWorkerRowGroup(input: ParquetSourceWorkerInput): RowGroup {
  return {
    num_rows: input.rowCount,
    total_byte_size: input.uncompressedByteLength,
    columns: input.columnChunks.map(columnChunk => ({
      file_path: columnChunk.filePath,
      meta_data: {
        type: columnChunk.physicalType,
        codec: columnChunk.compressionCodec,
        path_in_schema: columnChunk.path,
        num_values: columnChunk.valueCount,
        total_compressed_size: columnChunk.compressedByteLength,
        total_uncompressed_size: columnChunk.uncompressedByteLength,
        data_page_offset: columnChunk.dataPageOffset,
        dictionary_page_offset: columnChunk.dictionaryPageOffset,
        encodings: []
      }
    }))
  } as unknown as RowGroup;
}

/** Returns a row slice of every decoded column without constructing row objects. */
function sliceColumns(
  columns: Record<string, ArrayType>,
  start: number,
  end: number
): Record<string, ArrayType> {
  const slicedColumns: Record<string, ArrayType> = {};
  for (const [name, column] of Object.entries(columns)) {
    const slice = (column as ArrayType & {slice?: (start: number, end: number) => ArrayType}).slice;
    slicedColumns[name] = slice
      ? slice.call(column, start, end)
      : Array.prototype.slice.call(column, start, end);
  }
  return slicedColumns;
}

/** Returns a monotonic timestamp when available and falls back to wall-clock time. */
function getCurrentTime(): number {
  return globalThis.performance?.now() ?? Date.now();
}
