// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ParquetBoundingBox,
  ParquetPredicate,
  ParquetRowGroupMetadata
} from './parquet-source-types';

/** Byte range within an encoded Parquet page body. */
export type ParquetEncodedPageSection = Readonly<{
  /** Byte offset relative to {@link ParquetEncodedPage.data}. */
  byteOffset: number;
  /** Number of bytes in this section. */
  byteLength: number;
}>;

/** Whether the page value payload still uses the column chunk's compression codec. */
export type ParquetPageCompressionState = 'compressed' | 'decompressed';

/** Encoded Parquet page body suitable for deferred CPU or GPU decoding. */
export type ParquetEncodedPage = Readonly<{
  /** Page role and data-page version. */
  type: 'dictionary' | 'data-v1' | 'data-v2';
  /** Zero-based data-page ordinal within the column chunk; dictionaries use `-1`. */
  pageOrdinal: number;
  /** Value encoding declared by the page header. */
  encoding: string;
  /** Repetition-level encoding for V1 pages. V2 levels always use RLE. */
  repetitionLevelEncoding?: string;
  /** Definition-level encoding for V1 pages. V2 levels always use RLE. */
  definitionLevelEncoding?: string;
  /** Compression codec declared by the containing column chunk. */
  compression: string;
  /** Whether the page value payload remains compressed. */
  compressionState: ParquetPageCompressionState;
  /** Number of encoded values declared by the page header. */
  valueCount: number;
  /** Number of non-null values when the page header reports it directly. */
  nonNullValueCount?: number;
  /** Encoded page body without its Thrift page header. */
  data: Uint8Array;
  /** Repetition-level bytes, when their range can be known without decoding values. */
  repetitionLevels?: ParquetEncodedPageSection;
  /** Definition-level bytes, when their range can be known without decoding values. */
  definitionLevels?: ParquetEncodedPageSection;
  /** Value or dictionary bytes, when their range can be known before deferred decoding. */
  values?: ParquetEncodedPageSection;
  /** Compressed body byte length reported by the page header. */
  compressedByteLength: number;
  /** Uncompressed body byte length reported by the page header. */
  uncompressedByteLength: number;
}>;

/** One projected Parquet leaf column whose encoded pages have not been value-decoded. */
export type ParquetEncodedColumnChunk = Readonly<{
  /** Nested Parquet schema path. */
  path: readonly string[];
  /** Physical Parquet scalar type. */
  physicalType: string;
  /** Fixed byte width for FIXED_LEN_BYTE_ARRAY columns. */
  typeLength?: number;
  /** Maximum repetition level for this leaf column. */
  maxRepetitionLevel: number;
  /** Maximum definition level for this leaf column. */
  maxDefinitionLevel: number;
  /** Compression codec declared by the column chunk. */
  compression: string;
  /** Number of encoded values declared by the column chunk. */
  valueCount: number;
  /** Optional dictionary page associated only with this column chunk. */
  dictionary?: ParquetEncodedPage;
  /** Ordered data pages in this column chunk. */
  pages: readonly ParquetEncodedPage[];
}>;

/** Exact filters a deferred decoder must apply after conservative metadata pruning. */
export type ParquetDeferredPageFilter = Readonly<{
  /** Exact scalar predicate requested by the caller. */
  predicate?: ParquetPredicate;
  /** Exact spatial extent requested by the caller. */
  bbox?: ParquetBoundingBox;
  /** Geometry column associated with `bbox`. */
  geometryColumn?: string;
}>;

/** Candidate encoded pages returned for one Parquet row group. */
export type ParquetEncodedPageBatch = Readonly<{
  /** Stable discriminator for transport-neutral deferred Parquet pages. */
  shape: 'parquet-encoded-pages';
  /** Normalized row-group metadata. */
  rowGroup: ParquetRowGroupMetadata;
  /** Columns explicitly requested for final output. Empty means all columns. */
  projectedColumns: readonly string[];
  /** Hidden columns included so a deferred decoder can evaluate residual filters. */
  filterColumns: readonly string[];
  /** Column chunks keyed by their comma-joined Parquet schema path. */
  columns: Readonly<Record<string, ParquetEncodedColumnChunk>>;
  /** Exact work left after loaders.gl's conservative statistics and Bloom-filter pruning. */
  residualFilter?: ParquetDeferredPageFilter;
}>;

/** Options for reading encoded Parquet pages without materializing values or Arrow arrays. */
export type ParquetEncodedPageReadOptions = Readonly<{
  /** Zero-based row-group indexes to inspect, in output order. Defaults to all row groups. */
  rowGroups?: readonly number[];
  /** Top-level output columns. Defaults to all columns. */
  columns?: readonly string[];
  /** Retains candidate row groups for which the callback returns true. */
  rowGroupFilter?: (rowGroup: ParquetRowGroupMetadata) => boolean;
  /** Exact predicate used for conservative pruning and returned as residual work. */
  predicate?: ParquetPredicate;
  /** Spatial extent used for conservative pruning and returned as residual work. */
  bbox?: ParquetBoundingBox;
  /** Geometry column associated with `bbox`; defaults to the GeoParquet primary column. */
  geometryColumn?: string;
  /** Compression codecs to preserve for a downstream decoder instead of inflating on the CPU. */
  preserveCompression?: readonly string[];
  /** Abort this page read and its outstanding range requests. */
  signal?: AbortSignal;
}>;
