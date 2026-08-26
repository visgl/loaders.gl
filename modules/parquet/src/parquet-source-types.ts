// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as parquetWasm from 'parquet-wasm/esm/parquet_wasm.js';

import type {
  DataSourceOptions,
  RangeRequestScheduler,
  RangeRequestSchedulerProps,
  StrictLoaderOptions
} from '@loaders.gl/loader-utils';
import type {ArrowTableBatch, Schema} from '@loaders.gl/schema';
import type {
  ColumnarComparisonPredicate,
  ColumnarInPredicate,
  ColumnarLogicalPredicate,
  ColumnarNotPredicate,
  ColumnarNullPredicate,
  ColumnarPredicateProperty,
  ColumnarPredicateValue
} from '@loaders.gl/loader-utils';
import type {TableQueryExplain} from '@loaders.gl/loader-utils';
import type {FileMetaData} from './parquetjs/parquet-thrift/index';

/** Version validators captured from an HTTP Parquet object. */
export type ParquetObjectVersion = {
  /** HTTP entity tag returned by the object store. */
  etag?: string;
  /** HTTP last-modified timestamp returned by the object store. */
  lastModified?: string;
};

/** Footer statistics for one Parquet column chunk. */
export type ParquetColumnChunkStatistics = {
  /** Minimum value when the writer supplied valid statistics. */
  min?: unknown;
  /** Maximum value when the writer supplied valid statistics. */
  max?: unknown;
  /** Number of null values when reported by the writer. */
  nullCount?: number;
  /** Number of distinct values when reported by the writer. */
  distinctCount?: number;
  /** Whether the reported minimum is exact rather than truncated. */
  minIsExact?: boolean;
  /** Whether the reported maximum is exact rather than truncated. */
  maxIsExact?: boolean;
};

/** Native Parquet geospatial bounding-box statistics for a geometry column chunk. */
export type ParquetGeospatialBoundingBox = {
  /** Minimum x coordinate. For GEOGRAPHY this may exceed `xmax` across the antimeridian. */
  readonly xmin: number;
  /** Maximum x coordinate. */
  readonly xmax: number;
  /** Minimum y coordinate. */
  readonly ymin: number;
  /** Maximum y coordinate. */
  readonly ymax: number;
  /** Minimum z coordinate when at least one finite z value is present. */
  readonly zmin?: number;
  /** Maximum z coordinate when at least one finite z value is present. */
  readonly zmax?: number;
  /** Minimum measure when at least one finite m value is present. */
  readonly mmin?: number;
  /** Maximum measure when at least one finite m value is present. */
  readonly mmax?: number;
};

/** Native Parquet geospatial statistics for one geometry column chunk. */
export type ParquetGeospatialStatistics = {
  /** Coordinate bounds aggregated across non-null geometry values. */
  readonly bbox?: ParquetGeospatialBoundingBox;
  /** Distinct ISO WKB geometry type codes present in the column chunk. */
  readonly geometryTypes?: readonly number[];
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
  /** Absolute file offset of the optional per-page column statistics index. */
  readonly columnIndexOffset?: number;
  /** Serialized byte length of the optional per-page column statistics index. */
  readonly columnIndexByteLength?: number;
  /** Absolute file offset of the optional data-page location index. */
  readonly offsetIndexOffset?: number;
  /** Serialized byte length of the optional data-page location index. */
  readonly offsetIndexByteLength?: number;
  /** Absolute file offset of the optional split-block Bloom filter. */
  readonly bloomFilterOffset?: number;
  /** Serialized byte length of the optional split-block Bloom filter. */
  readonly bloomFilterByteLength?: number;
  /** Optional min/max and count statistics decoded from the footer. */
  readonly statistics?: ParquetColumnChunkStatistics;
  /** Native geospatial statistics decoded from a Parquet 2.11+ footer. */
  readonly geospatialStatistics?: ParquetGeospatialStatistics;
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

/** Scalar values supported by exact Parquet source predicates. */
export type ParquetPredicateValue = ColumnarPredicateValue;

/** Four-, six-, or eight-dimensional extent used for conservative Parquet spatial pruning. */
export type ParquetBoundingBox =
  | readonly [number, number, number, number]
  | readonly [number, number, number, number, number, number]
  | readonly [number, number, number, number, number, number, number, number];

/** Reference to one Parquet column in a predicate expression. */
export type ParquetPredicateProperty = ColumnarPredicateProperty;

/** Comparison predicate applied to one top-level Parquet column. */
export type ParquetComparisonPredicate = Omit<ColumnarComparisonPredicate, 'args'> & {
  args: readonly [ParquetPredicateProperty, ParquetPredicateValue];
};

/** Membership predicate applied to one top-level Parquet column. */
export type ParquetInPredicate = Omit<ColumnarInPredicate, 'args'> & {
  args: readonly [ParquetPredicateProperty, readonly ParquetPredicateValue[]];
};

/** Null predicate applied to one top-level Parquet column. */
export type ParquetNullPredicate = Omit<ColumnarNullPredicate, 'args'> & {
  args: readonly [ParquetPredicateProperty];
};

/** Logical composition of serializable Parquet predicates. */
export type ParquetLogicalPredicate = Omit<ColumnarLogicalPredicate, 'args'> & {
  args: readonly ParquetPredicate[];
};

/** Negation of one serializable Parquet predicate. */
export type ParquetNotPredicate = Omit<ColumnarNotPredicate, 'args'> & {
  args: readonly [ParquetPredicate];
};

/**
 * Serializable exact row predicate used by selective Parquet source reads.
 *
 * The expression shape is directionally aligned with CQL2 JSON, but this experimental subset does
 * not claim CQL2 conformance.
 */
export type ParquetPredicate =
  | ParquetComparisonPredicate
  | ParquetInPredicate
  | ParquetNullPredicate
  | ParquetLogicalPredicate
  | ParquetNotPredicate;

/** Options for one selective `ParquetSource.read()` operation. */
export type ParquetSourceReadOptions = {
  /** Zero-based row-group indexes to decode, in output order. Defaults to all row groups. */
  rowGroups?: readonly number[];
  /** Top-level columns to fetch and decode. Defaults to all columns. */
  columns?: readonly string[];
  /** Maximum number of rows retained after filtering across all emitted batches. */
  limit?: number;
  /** Maximum number of rows in each emitted Arrow batch. Defaults to one row group per batch. */
  batchSize?: number;
  /** Maximum number of row groups decoded concurrently. */
  concurrency?: number;
  /** Retains candidate row groups for which the predicate returns true. */
  rowGroupFilter?: (rowGroup: ParquetRowGroupMetadata) => boolean;
  /** Serializable exact row predicate, conservatively pushed into row-group statistics. */
  predicate?: ParquetPredicate;
  /** Spatial extent pruned with native statistics or a GeoParquet 1.1 bbox covering when present. */
  bbox?: ParquetBoundingBox;
  /** Geometry column whose GeoParquet covering should serve `bbox`; defaults to `primary_column`. */
  geometryColumn?: string;
  /** Abort this read and all of its outstanding range requests. */
  signal?: AbortSignal;
};

/** Explain result for a Parquet table query, including footer-level row-group pruning. */
export type ParquetSourceExplain = TableQueryExplain<ParquetPredicate> &
  Readonly<{
    /** Physical source kind. */
    source: 'parquet';
    /** Row groups selected by the request and conservative footer statistics. */
    rowGroups: Readonly<{
      requested: number;
      selected: number;
      prunedByStatistics: number;
    }>;
  }>;

/** Compatibility alias for selective source read options. */
export type ParquetReadOptions = ParquetSourceReadOptions;

/** Cumulative transport, decode, conversion, and pruning counters for one source. */
export type ParquetTelemetry = {
  /** Number of HTTP byte-range requests sent by this source. */
  rangeRequestCount: number;
  /** Number of transport bytes requested from the remote object. */
  requestedBytes: number;
  /** Number of response bytes downloaded from the remote object. */
  downloadedBytes: number;
  /** Number of exact byte ranges served from the source cache. */
  cacheHits: number;
  /** Total time spent awaiting HTTP range requests. */
  networkDurationMs: number;
  /** Number of failed HTTP range requests. */
  failedRangeRequestCount: number;
  /** Number of aborted HTTP range requests. */
  abortedRangeRequestCount: number;
  /** Retry attempts made by this source. Currently zero because reads fail fast. */
  retryCount: number;
  /** Time spent fetching, decompressing, and decoding selected row groups. */
  decodeDurationMs: number;
  /** Time spent converting decoded columns into Arrow batches. */
  arrowConversionDurationMs: number;
  /** Candidate row groups considered by read operations. */
  rowGroupsRequested: number;
  /** Candidate row groups rejected by callbacks or automatic statistics pruning. */
  rowGroupsPruned: number;
  /** Candidate row groups proven impossible using footer statistics. */
  rowGroupsPrunedByStatistics: number;
  /** Candidate row groups proven impossible using split-block Bloom filters. */
  rowGroupsPrunedByBloomFilter: number;
  /** Bloom-filter payloads fetched for selective reads. */
  bloomFiltersRead: number;
  /** Bytes fetched for Bloom-filter payloads. */
  bloomFilterBytesRead: number;
  /** Row groups proven impossible using page-level column indexes. */
  rowGroupsPrunedByPageIndex: number;
  /** Column-index and offset-index blobs decoded for selective reads. */
  pageIndexesRead: number;
  /** Data pages fetched for page-index-planned reads. */
  pagesRead: number;
  /** Data pages avoided by page-index-planned reads. */
  pagesPruned: number;
  /** Candidate rows eliminated before data-page reads. */
  rowsPrunedByPageIndex: number;
  /** Row groups successfully decoded. */
  rowGroupsDecoded: number;
  /** Arrow batches emitted by read operations. */
  batchesEmitted: number;
  /** Rows emitted by read operations. */
  rowsEmitted: number;
  /** Decoded rows tested by exact predicates. */
  predicateRowsTested: number;
  /** Decoded rows retained by exact predicates. */
  predicateRowsMatched: number;
  /** Read operations cancelled by signals, source close, or early iterator return. */
  cancellationCount: number;
  /** Read operations that failed for reasons other than cancellation. */
  failedReadCount: number;
};

/** Event emitted after one Parquet source telemetry update. */
export type ParquetTelemetryEvent = {
  /** Operation that produced the telemetry update. */
  type:
    | 'range-request'
    | 'cache-hit'
    | 'row-group-prune'
    | 'bloom-filter'
    | 'page-index-prune'
    | 'predicate-filter'
    | 'decode'
    | 'arrow-conversion'
    | 'batch'
    | 'cancel'
    | 'read-error';
  /** Cumulative snapshot after applying this event. */
  telemetry: ParquetTelemetry;
  /** Row-group index associated with the event, when applicable. */
  rowGroupIndex?: number;
  /** Row count associated with a batch event. */
  rowCount?: number;
  /** Duration contributed by this event. */
  durationMs?: number;
  /** Error associated with a failed request or read. */
  error?: unknown;
};

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
  /** Source row indexes within the row group when filtering produces a non-contiguous batch. */
  readonly rowGroupRowIndices?: readonly number[];
  /** Absolute source row indexes when filtering produces a non-contiguous batch. */
  readonly rowIndices?: readonly number[];
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
  /** Source integration and worker execution options. */
  core?: NonNullable<DataSourceOptions['core']> &
    Pick<
      NonNullable<StrictLoaderOptions['core']>,
      'worker' | 'maxConcurrency' | 'maxMobileConcurrency' | 'reuseWorkers' | '_workerType'
    >;
  parquet?: ParquetSourceReadOptions & {
    /** HTTP headers forwarded to every remote Parquet request. */
    headers?: HeadersInit;
    /** Preserve binary values when the TypeScript decoder is used for later reads. */
    preserveBinary?: boolean;
    /** Receives cumulative transport, pruning, decode, and batch telemetry events. */
    onTelemetry?: (event: ParquetTelemetryEvent) => void;
    /** Overrides the package-local worker used for selective source decoding. */
    workerUrl?: string;
    /** Retained for source API compatibility; the TypeScript backend does not initialize WASM. */
    wasmUrl?: parquetWasm.InitInput | Promise<parquetWasm.InitInput>;
  };
  /** Byte-range scheduling and diagnostics configuration. */
  rangeRequests?: ParquetRangeRequestOptions;
};

/** Four-, six-, or eight-dimensional extent used for conservative Parquet dataset file pruning. */
export type ParquetDatasetBoundingBox =
  | readonly [number, number, number, number]
  | readonly [number, number, number, number, number, number]
  | readonly [number, number, number, number, number, number, number, number];

/** Scalar value carried by a partitioned Parquet dataset file descriptor. */
export type ParquetDatasetPartitionValue = string | number | boolean | null;

/** One independently range-readable file in a logical Parquet dataset. */
export type ParquetDatasetFile = {
  /** URL or Blob passed to the child `ParquetSource`. */
  readonly data: string | Blob;
  /** Stable application-defined file identifier. */
  readonly id?: string;
  /** Conservative spatial extent used before opening the file. */
  readonly bbox?: ParquetDatasetBoundingBox;
  /** Hive-style or catalog-derived partition values. */
  readonly partitions?: Readonly<Record<string, ParquetDatasetPartitionValue>>;
  /** Opaque catalog metadata copied into emitted batch provenance. */
  readonly metadata?: Readonly<Record<string, unknown>>;
};

/** File-discovery constraints passed to a Parquet dataset provider. */
export type ParquetDatasetFileQuery = {
  /** Spatial extent used by catalog-backed providers and local descriptor pruning. */
  bbox?: ParquetDatasetBoundingBox;
  /** Exact partition values, or accepted values for each requested partition. */
  partitions?: Readonly<
    Record<string, ParquetDatasetPartitionValue | readonly ParquetDatasetPartitionValue[]>
  >;
  /** Aborts catalog traversal or file discovery. */
  signal?: AbortSignal;
};

/** Synchronous or asynchronous collection returned by a Parquet dataset provider. */
export type ParquetDatasetFileCollection =
  | Iterable<ParquetDatasetFile>
  | AsyncIterable<ParquetDatasetFile>;

/** Lazy catalog adapter that discovers Parquet files for one dataset query. */
export type ParquetDatasetFileProvider = (
  query: ParquetDatasetFileQuery
) => ParquetDatasetFileCollection | Promise<ParquetDatasetFileCollection>;

/** Reusable static descriptors or a lazy catalog-backed provider accepted by the dataset source. */
export type ParquetDatasetFiles = readonly ParquetDatasetFile[] | ParquetDatasetFileProvider;

/** Options for constructing a multi-file `ParquetDatasetSource`. */
export type ParquetDatasetSourceOptions = ParquetSourceLoaderOptions & {
  parquetDataset?: {
    /** Maximum files read concurrently. Defaults to 4. */
    fileConcurrency?: number;
    /** Require every selected file to have the same field schema. Defaults to true. */
    validateSchema?: boolean;
  };
};

/** Options for one multi-file Parquet dataset read. */
export type ParquetDatasetReadOptions = Omit<ParquetSourceReadOptions, 'rowGroups' | 'signal'> &
  ParquetDatasetFileQuery & {
    /** Maximum files read concurrently for this operation. */
    fileConcurrency?: number;
  };

/** Dataset and file provenance attached to an emitted Arrow batch. */
export type ParquetDatasetBatchProvenance = ParquetBatchProvenance & {
  /** Zero-based descriptor position in provider output, before local pruning. */
  readonly datasetFileIndex: number;
  /** Stable descriptor identifier, falling back to child source identity. */
  readonly datasetFileId: string;
  /** Partition values supplied by the file descriptor. */
  readonly datasetPartitions?: Readonly<Record<string, ParquetDatasetPartitionValue>>;
  /** Opaque catalog metadata supplied by the file descriptor. */
  readonly datasetFileMetadata?: Readonly<Record<string, unknown>>;
};

/** Arrow batch emitted by `ParquetDatasetSource.read()`. */
export type ParquetDatasetBatch = ArrowTableBatch<ParquetDatasetBatchProvenance> &
  ParquetDatasetBatchProvenance;

/** Cumulative discovery, pruning, output, and child-source counters for one dataset source. */
export type ParquetDatasetTelemetry = {
  /** File descriptors returned by the provider. */
  filesDiscovered: number;
  /** File descriptors retained after local pruning. */
  filesSelected: number;
  /** Files rejected using descriptor bounding boxes. */
  filesPrunedByBoundingBox: number;
  /** Files rejected using descriptor partition values. */
  filesPrunedByPartitions: number;
  /** Child Parquet sources opened. */
  filesOpened: number;
  /** Arrow batches emitted across all files. */
  batchesEmitted: number;
  /** Rows emitted across all files. */
  rowsEmitted: number;
  /** Aggregated child-source telemetry for completed or failed file reads. */
  parquet: ParquetTelemetry;
};
