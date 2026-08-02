// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  DataSourceOptions,
  RangeRequestScheduler,
  RangeRequestSchedulerProps
} from '@loaders.gl/loader-utils';
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
  path: string[];
  /** Compression codec declared by the column chunk. */
  compression: string;
  /** Number of encoded values, including repeated values. */
  valueCount: number;
  /** Compressed byte length of the column chunk. */
  compressedByteLength: number;
  /** Uncompressed byte length of the column chunk. */
  uncompressedByteLength: number;
  /** Absolute file offset of the first data page. */
  dataPageOffset: number;
  /** Absolute file offset of the dictionary page, when present. */
  dictionaryPageOffset?: number;
};

/** Normalized metadata for one Parquet row group. */
export type ParquetRowGroupMetadata = {
  /** Zero-based row-group index. */
  index: number;
  /** Number of logical rows in the row group. */
  rowCount: number;
  /** Total uncompressed byte length declared by the row group. */
  uncompressedByteLength: number;
  /** Sum of compressed column-chunk byte lengths. */
  compressedByteLength: number;
  /** Column chunks contained in the row group. */
  columns: ParquetColumnChunkMetadata[];
};

/** Dataset-level metadata returned by `ParquetSource.getMetadata()`. */
export type ParquetSourceMetadata = {
  /** Display name inferred from the URL or File name. */
  name: string;
  /** Resolved source URL for remote datasets. */
  url?: string;
  /** Total Parquet object byte length. */
  fileByteLength: number;
  /** Parquet format version stored in the footer. */
  formatVersion: number;
  /** Writer identifier stored in the footer. */
  createdBy?: string;
  /** Total logical row count. */
  rowCount: number;
  /** Number of row groups. */
  rowGroupCount: number;
  /** User key/value metadata stored in the footer. */
  keyValueMetadata: Record<string, string>;
  /** Normalized row-group and column-chunk metadata. */
  rowGroups: ParquetRowGroupMetadata[];
  /** HTTP object validators captured when opening a remote source. */
  objectVersion?: ParquetObjectVersion;
  /** Raw decoded Parquet footer, included only when requested. */
  formatSpecificMetadata?: FileMetaData;
};

/** Options for one Parquet source metadata request. */
export type ParquetMetadataRequestOptions = {
  /** Include the decoded Parquet thrift footer in the returned metadata. */
  formatSpecificMetadata?: boolean;
  /** Abort source initialization and its range requests. */
  signal?: AbortSignal;
};

/** Range transport options for `ParquetSourceLoader`. */
export type ParquetRangeRequestOptions = RangeRequestSchedulerProps & {
  /** Reusable scheduler shared with other range-addressable sources. */
  scheduler?: RangeRequestScheduler;
};

/** Options for constructing a `ParquetSource`. */
export type ParquetSourceLoaderOptions = DataSourceOptions & {
  parquet?: {
    /** HTTP headers forwarded to every remote Parquet request. */
    headers?: HeadersInit;
    /** Preserve binary values when the TypeScript decoder is used for later reads. */
    preserveBinary?: boolean;
  };
  /** Byte-range scheduling and diagnostics configuration. */
  rangeRequests?: ParquetRangeRequestOptions;
};
