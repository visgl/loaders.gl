// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as parquetWasm from 'parquet-wasm/esm/parquet_wasm.js';

import type {
  DataSourceOptions,
  RangeRequestScheduler,
  RangeRequestSchedulerProps
} from '@loaders.gl/loader-utils';
import type {ArrowTableBatch, Schema} from '@loaders.gl/schema';
import type {FileMetaData} from './parquetjs/parquet-thrift/index';

/** Version validators captured from an HTTP Parquet object. */
export type ParquetObjectVersion = {
  /** HTTP entity tag returned by the object store. */
  etag?: string;
  /** HTTP last-modified timestamp returned by the object store. */
  lastModified?: string;
};

/** Normalized metadata for one Parquet column chunk. */
export type ParquetColumnChunkMetadata = {
  /** Nested column path in the Parquet schema. */
  readonly path: readonly string[];
  /** Optional external file containing the chunk. */
  readonly filePath?: string;
  /** Compression codec declared by the column chunk. */
  readonly compression: string;
  /** Encodings declared by the column chunk. */
  readonly encodings: readonly string[];
  /** Number of encoded values, including repeated values. */
  readonly valueCount: number;
  /** Absolute file offset of the beginning of the column chunk. */
  readonly fileOffset: number;
  /** Compressed byte length of the column chunk. */
  readonly compressedByteLength: number;
  /** Compatibility alias for `compressedByteLength`. */
  readonly compressedSize: number;
  /** Uncompressed byte length of the column chunk. */
  readonly uncompressedByteLength: number;
  /** Compatibility alias for `uncompressedByteLength`. */
  readonly uncompressedSize: number;
  /** Absolute file offset of the first data page. */
  readonly dataPageOffset: number;
  /** Absolute file offset of the dictionary page, when present. */
  readonly dictionaryPageOffset?: number;
};

/** Normalized metadata for one Parquet row group. */
export type ParquetRowGroupMetadata = {
  /** Zero-based row-group index. */
  readonly index: number;
  /** Absolute logical row offset of the row group in the source file. */
  readonly rowOffset: number;
  /** Number of logical rows in the row group. */
  readonly rowCount: number;
  /** Total uncompressed byte length declared by the row group. */
  readonly uncompressedByteLength: number;
  /** Compatibility alias for `uncompressedByteLength`. */
  readonly uncompressedSize: number;
  /** Sum of compressed column-chunk byte lengths. */
  readonly compressedByteLength: number;
  /** Compatibility alias for `compressedByteLength`. */
  readonly compressedSize: number;
  /** Column chunks contained in the row group. */
  readonly columns: readonly ParquetColumnChunkMetadata[];
};

/** Dataset-level metadata returned by `ParquetSource.getMetadata()`. */
export type ParquetSourceMetadata = {
  /** Arrow-compatible loaders.gl schema. */
  readonly schema: Schema;
  /** Display name inferred from the URL or File name. */
  readonly name: string;
  /** Resolved source URL for remote datasets. */
  readonly url?: string;
  /** Total Parquet object byte length. */
  readonly fileByteLength: number;
  /** Parquet format version stored in the footer. */
  readonly version: number;
  /** Compatibility alias for `version`. */
  readonly formatVersion: number;
  /** Writer identifier stored in the footer. */
  readonly createdBy?: string;
  /** Total logical row count. */
  readonly rowCount: number;
  /** Number of row groups. */
  readonly rowGroupCount: number;
  /** User key/value metadata stored in the footer. */
  readonly keyValueMetadata: Readonly<Record<string, string>>;
  /** Normalized row-group and column-chunk metadata. */
  readonly rowGroups: readonly ParquetRowGroupMetadata[];
  /** HTTP object validators captured when opening a remote source. */
  readonly objectVersion?: ParquetObjectVersion;
  /** Raw decoded Parquet footer, included only when requested. */
  readonly formatSpecificMetadata?: FileMetaData;
};

/** Options for one Parquet source metadata request. */
export type ParquetMetadataRequestOptions = {
  /** Include the decoded Parquet thrift footer in the returned metadata. */
  formatSpecificMetadata?: boolean;
  /** Abort source initialization and its range requests. */
  signal?: AbortSignal;
};

/** Options for one selective `ParquetSource.read()` operation. */
export type ParquetSourceReadOptions = {
  /** Zero-based row-group indexes to decode, in output order. Defaults to all row groups. */
  rowGroups?: readonly number[];
  /** Top-level columns to fetch and decode. Defaults to all columns. */
  columns?: readonly string[];
  /** Maximum number of rows in each emitted Arrow batch. Defaults to one row group per batch. */
  batchSize?: number;
  /** Maximum number of row groups decoded concurrently. */
  concurrency?: number;
  /** Abort this read and all of its outstanding range requests. */
  signal?: AbortSignal;
};

/** Compatibility alias for selective source read options. */
export type ParquetReadOptions = ParquetSourceReadOptions;

/** Stable source and row-position information attached to every Parquet batch. */
export type ParquetBatchProvenance = {
  /** Source URL, File name, or stable Blob label. */
  readonly sourceId: string;
  /** Source URL when the source is remote. */
  readonly sourceUrl?: string;
  /** Compatibility alias for `sourceId`. */
  readonly source: string;
  /** Zero-based row-group index in the source file. */
  readonly rowGroupIndex: number;
  /** Absolute logical row offset of the first batch row in the source file. */
  readonly rowOffset: number;
  /** Logical offset of the first batch row within its row group. */
  readonly rowGroupRowOffset: number;
  /** Number of rows in the batch. */
  readonly rowCount: number;
};

/** Compatibility alias for Parquet batch provenance. */
export type ParquetBatchMetadata = ParquetBatchProvenance;

/** Arrow batch returned by `ParquetSource.read()` with source provenance. */
export type ParquetBatch = ArrowTableBatch<ParquetBatchProvenance> & ParquetBatchProvenance;

/** Compatibility alias for Arrow batches returned by `ParquetSource.read()`. */
export type ParquetSourceBatch = ParquetBatch;

/** Range transport options for `ParquetSourceLoader`. */
export type ParquetRangeRequestOptions = RangeRequestSchedulerProps & {
  /** Reusable scheduler shared with other range-addressable sources. */
  scheduler?: RangeRequestScheduler;
};

/** Options for constructing a `ParquetSource`. */
export type ParquetSourceLoaderOptions = DataSourceOptions & {
  parquet?: ParquetSourceReadOptions & {
    /** HTTP headers forwarded to every remote Parquet request. */
    headers?: HeadersInit;
    /** Preserve binary values when the TypeScript decoder is used for later reads. */
    preserveBinary?: boolean;
    /** Retained for source API compatibility; the TypeScript backend does not initialize WASM. */
    wasmUrl?: parquetWasm.InitInput | Promise<parquetWasm.InitInput>;
  };
  /** Byte-range scheduling and diagnostics configuration. */
  rangeRequests?: ParquetRangeRequestOptions;
};
