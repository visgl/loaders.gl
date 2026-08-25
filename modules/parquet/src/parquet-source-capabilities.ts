// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TableQueryCapabilities} from '@loaders.gl/loader-utils';

/** Portable table-query capabilities of Parquet-backed scans. */
export const PARQUET_TABLE_QUERY_CAPABILITIES: TableQueryCapabilities = Object.freeze({
  projection: 'pushdown',
  predicate: 'pushdown',
  limit: 'pushdown',
  streaming: true,
  cancellation: true
});

/** Feature support advertised by a {@link ParquetSource}. */
export type ParquetSourceCapabilities = Readonly<{
  /** Common portable query contract supported by this source. */
  tableQuery: TableQueryCapabilities;
  /** Schema and footer metadata are cached for the lifetime of the source. */
  supportsCachedMetadata: boolean;
  /** Reads can select explicit Parquet row groups. */
  supportsRowGroupSelection: boolean;
  /** Reads can project explicit Parquet column paths. */
  supportsColumnProjection: boolean;
  /** Every emitted batch identifies its source row group and row offsets. */
  supportsBatchProvenance: boolean;
  /** Read cancellation is propagated cooperatively through the active stream. */
  supportsCooperativeReadCancellation: boolean;
  /** The package includes a local parquet-wasm binary for self-hosted delivery. */
  supportsLocalWasmAsset: boolean;
  /** Column min/max/null statistics are exposed in public metadata. */
  supportsColumnStatistics: boolean;
  /** Serializable predicates can prune impossible row groups using column statistics. */
  supportsPredicatePushdown: boolean;
  /** Column and offset indexes can avoid irrelevant data-page reads for non-repeated columns. */
  supportsPageIndexPruning: boolean;
  /** Native geospatial statistics and GeoParquet 1.1 coverings drive spatial pruning. */
  supportsGeoParquetSpatialPruning: boolean;
  /** Surviving decoded rows are filtered exactly on the caller thread or worker. */
  supportsExactPredicateFiltering: boolean;
  /** Callers can supply the random-access transport used by the source. */
  supportsCustomRangeTransport: boolean;
  /** Range requests validate that the source object version remains unchanged. */
  supportsObjectVersionValidation: boolean;
  /** Requested bytes, downloaded bytes, request counts, and network time are reported. */
  supportsNetworkTelemetry: boolean;
  /** Decoder time is reported separately from network and Arrow conversion time. */
  supportsDecodeTelemetry: boolean;
  /** Parquet decoding can run in a worker and transfer Arrow output. */
  supportsWorkerDecoding: boolean;
}>;

/** Capabilities of the current range-backed TypeScript {@link ParquetSource}. */
export const PARQUET_SOURCE_CAPABILITIES: ParquetSourceCapabilities = Object.freeze({
  tableQuery: PARQUET_TABLE_QUERY_CAPABILITIES,
  supportsCachedMetadata: true,
  supportsRowGroupSelection: true,
  supportsColumnProjection: true,
  supportsBatchProvenance: true,
  supportsCooperativeReadCancellation: true,
  supportsLocalWasmAsset: true,
  supportsColumnStatistics: true,
  supportsPredicatePushdown: true,
  supportsPageIndexPruning: true,
  supportsGeoParquetSpatialPruning: true,
  supportsExactPredicateFiltering: true,
  supportsCustomRangeTransport: true,
  supportsObjectVersionValidation: true,
  supportsNetworkTelemetry: true,
  supportsDecodeTelemetry: true,
  supportsWorkerDecoding: true
});
