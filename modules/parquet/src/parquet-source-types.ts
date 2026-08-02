// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as parquetWasm from 'parquet-wasm/esm/parquet_wasm.js';

import type {DataSourceOptions} from '@loaders.gl/loader-utils';
import type {ArrowTableBatch, Schema} from '@loaders.gl/schema';

/** Options applied to each read from a Parquet source. */
export type ParquetSourceReadOptions = {
  /** Row-group indexes to read. Defaults to all row groups in file order. */
  rowGroups?: readonly number[];
  /** Column paths to project. Defaults to all columns. */
  columns?: readonly string[];
  /** Target number of rows in each returned Arrow batch. */
  batchSize?: number;
  /** Number of concurrent range requests used by parquet-wasm. */
  concurrency?: number;
};

/** Options for creating a Parquet source. */
export type ParquetSourceLoaderOptions = DataSourceOptions & {
  parquet?: ParquetSourceReadOptions & {
    /** URL or module used to initialize parquet-wasm. */
    wasmUrl?: parquetWasm.InitInput | Promise<parquetWasm.InitInput>;
  };
};

/** Plain metadata for one Parquet column chunk. */
export type ParquetColumnChunkMetadata = {
  /** Nested column path. */
  readonly path: readonly string[];
  /** Optional external file containing the chunk. */
  readonly filePath?: string;
  /** Byte offset reported by the Parquet footer. */
  readonly fileOffset: bigint;
  /** Number of encoded values in the chunk. */
  readonly valueCount: number;
  /** Compression codec name. */
  readonly compression: string;
  /** Encodings used by the chunk. */
  readonly encodings: readonly string[];
  /** Compressed chunk size in bytes. */
  readonly compressedSize: number;
  /** Uncompressed chunk size in bytes. */
  readonly uncompressedSize: number;
};

/** Plain metadata for one Parquet row group. */
export type ParquetRowGroupMetadata = {
  /** Zero-based row-group index. */
  readonly index: number;
  /** Absolute offset of the first row in the file. */
  readonly rowOffset: number;
  /** Number of rows in the row group. */
  readonly rowCount: number;
  /** Total compressed column size in bytes. */
  readonly compressedSize: number;
  /** Total uncompressed column size in bytes. */
  readonly uncompressedSize: number;
  /** Column chunks in this row group. */
  readonly columns: readonly ParquetColumnChunkMetadata[];
};

/** Cached schema and footer metadata exposed by a Parquet source. */
export type ParquetSourceMetadata = {
  /** Arrow-compatible loaders.gl schema. */
  readonly schema: Schema;
  /** Parquet format version stored in the footer. */
  readonly version: number;
  /** Total number of rows in the file. */
  readonly rowCount: number;
  /** Application string stored by the Parquet writer. */
  readonly createdBy?: string;
  /** File-level key/value metadata. */
  readonly keyValueMetadata: Readonly<Record<string, string>>;
  /** Row-group and column-chunk metadata. */
  readonly rowGroups: readonly ParquetRowGroupMetadata[];
};

/** Provenance attached to every Arrow batch returned by a Parquet source. */
export type ParquetBatchMetadata = {
  /** Source URL, File name, or a stable Blob label. */
  readonly sourceId: string;
  /** Row group that produced this batch. */
  readonly rowGroupIndex: number;
  /** Absolute offset of the first batch row in the source file. */
  readonly rowOffset: number;
  /** Offset of the first batch row within its row group. */
  readonly rowGroupRowOffset: number;
};

/** Arrow batch returned by a Parquet source. */
export type ParquetSourceBatch = Omit<ArrowTableBatch<ParquetBatchMetadata>, 'metadata'> & {
  /** Provenance for the source rows represented by this batch. */
  readonly metadata: ParquetBatchMetadata;
};
