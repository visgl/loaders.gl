// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DehydratedArrowTable} from '@loaders.gl/arrow';
import type {StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {Schema} from '@loaders.gl/schema';

import type {ParquetPredicate} from '../parquet-source-types';
import type {ParquetPagePruningPlan} from './parquet-page-index';
import type {SchemaDefinition} from '../parquetjs/schema/declare';

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
  /** Serializable exact predicate evaluated after decoding. */
  predicate?: ParquetPredicate;
  /** Selective data-page plan prepared from column and offset indexes on the caller thread. */
  pagePlan?: ParquetPagePruningPlan;
  /** Whether BYTE_ARRAY values stay binary during logical conversion. */
  preserveBinary: boolean;
  /** Whether page CRC values are verified while decoding in the worker. */
  verifyPageChecksums: boolean;
};

/** One directly transferable Arrow batch decoded by a Parquet source worker. */
export type ParquetSourceWorkerBatch = {
  /** Logical offset of this batch within its row group. */
  rowGroupRowOffset: number;
  /** Logical rows in this batch. */
  rowCount: number;
  /** Exact source row indexes represented by this batch. */
  rowGroupRowIndices?: number[];
  /** Dehydrated Arrow table whose primitive buffers are directly transferable. */
  arrowTable: DehydratedArrowTable;
};

/** Result returned by one worker-backed Parquet source row-group decode. */
export type ParquetSourceWorkerResult = {
  /** Logical row count in the decoded source row group before filtering. */
  sourceRowCount: number;
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
  /** Private descriptor options keyed by the selective worker id. */
  'parquet-source'?: {
    /** Overrides the package-local selective Parquet worker asset. */
    workerUrl?: string;
  };
  /** Parquet cancellation controls. */
  parquet?: {
    /** Terminates active worker jobs when aborted. */
    signal?: AbortSignal;
  };
};
