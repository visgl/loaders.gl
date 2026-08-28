// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {createScanEngine, registerScanBackend} from './scan-engine';
// The low-level executor lives in loader-utils so format packages can reuse it without importing
// this optional module. It is re-exported here as the scan package's common batch adapter.
export {
  executeTableScanBatches,
  filterTableBatch,
  makeTableScanBatch,
  projectTableBatch,
  projectTableSchema,
  truncateTableBatch
} from '@loaders.gl/loader-utils';
export type {TableScanBatchReader, TableScanBatchOperators} from '@loaders.gl/loader-utils';
export type {
  ScanBackend,
  ScanBackendLoader,
  ScanBackendName,
  ScanEngine,
  ScanEngineOptions
} from './scan-engine';

// Re-export the query vocabulary from one optional entry point for applications. Format adapters
// should continue importing the lightweight contracts from @loaders.gl/loader-utils.
export {parseSQLPredicate} from '@loaders.gl/sql';
export type {ArrowQueryOptions, SQLPredicate} from '@loaders.gl/sql';
export type {
  RelationalAggregate,
  RelationalExpression,
  RelationalOrderKey,
  TableQueryOptions
} from '@loaders.gl/loader-utils';

export {
  createScanQueryMetadata,
  intersectPointCloudBounds,
  selectPointCloudScanTiles,
  validatePointCloudQueryOptions
} from '@loaders.gl/loader-utils';
export type {
  CreateScanQueryMetadataOptions,
  PointCloudQueryBounds,
  PointCloudQueryCapabilities,
  PointCloudQueryOptions,
  PointCloudScanChildrenLoader,
  PointCloudScanReadOptions,
  PointCloudScanSource,
  PointCloudScanTile,
  RasterQueryCapabilities,
  RasterQueryOptions,
  ScanBounds,
  ScanColumnMetadata,
  ScanColumnRole,
  ScanExecutionMethod,
  ScanExecutionTelemetry,
  ScanExecutionTelemetryCallback,
  ScanExecutionTelemetryStatus,
  ScanSourceExecutionTelemetry,
  ScanExecutionSupport,
  ScanQueryCapabilities,
  ScanQueryMetadata,
  ScanQueryMetadataOptions,
  ScanQueryMetadataProvider,
  ScanRasterLevel,
  ScanSourceStatistics,
  ScanSpatialMetadata,
  TableScanReadOptions,
  TableScanSource
} from '@loaders.gl/loader-utils';
export type {ScanQuery} from './scan-query';

export {
  FEDERATED_TABLE_QUERY_CAPABILITIES,
  FederatedTableScanSource
} from './federated-table-scan-source';
export type {
  FederatedTableBatch,
  FederatedTableBatchProvenance,
  FederatedTableScanExplain,
  FederatedTableScanSourceOptions,
  FederatedTableSchemaPolicy,
  FederatedTableSourceEntry,
  FederatedTableSourceExplain
} from './federated-table-scan-source';

export {
  AddressedVectorTableScanSource,
  VectorFeatureTableScanSource,
  VectorTileTableScanSource
} from './vector-table-scan-source';
export type {
  VectorFeatureTableScanSourceOptions,
  VectorTableScanSourceOptions,
  VectorTileTableScanSourceOptions
} from './vector-table-scan-source';
