// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DehydratedArrowTable} from '@loaders.gl/arrow';
import type {StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {Schema} from '@loaders.gl/schema';

import type {SchemaDefinition} from '../parquetjs/schema/declare';

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

/** Returns true when a worker input requests selective Parquet source decoding. */
export function isParquetSourceWorkerInput(input: unknown): input is ParquetSourceWorkerInput {
  return Boolean(
    input &&
      typeof input === 'object' &&
      (input as {operation?: unknown}).operation === PARQUET_SOURCE_WORKER_OPERATION
  );
}
