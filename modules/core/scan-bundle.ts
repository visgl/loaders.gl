// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Startup entry points import their implementation modules to keep the full query API lazy. */
export {createScanEngine, registerScanBackend} from './src/scan/scan-engine';
export {
  executeTableScanBatches,
  filterTableBatch,
  projectTableBatch,
  projectTableSchema,
  truncateTableBatch,
  createScanQueryMetadata,
  intersectPointCloudBounds,
  selectPointCloudScanTiles,
  validatePointCloudQueryOptions
} from '@loaders.gl/core/loader-utils';
export {parseSQLPredicate} from './src/scan/parse-sql-predicate';
export {
  FEDERATED_TABLE_QUERY_CAPABILITIES,
  FederatedTableScanSource
} from './src/scan/federated-table-scan-source';
export {
  AddressedVectorTableScanSource,
  VectorFeatureTableScanSource,
  VectorTileTableScanSource
} from './src/scan/vector-table-scan-source';
export type {
  TableScanBatchReader,
  TableScanBatchOperators,
  ScanBackend,
  ScanBackendLoader,
  ScanBackendName,
  ScanEngine,
  ScanEngineOptions,
  ArrowQueryOptions,
  SQLPredicate,
  RelationalAggregate,
  RelationalExpression,
  RelationalOrderKey,
  TableQuery,
  TableSelection,
  TableQueryExecutionOptions,
  TableQueryOptions,
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
  TableQueryExecutionSummary,
  TableQueryCompleteCallback,
  TableQueryExecutionStatus,
  TableQuerySourceExecutionSummary,
  ScanExecutionSupport,
  ScanQueryCapabilities,
  ScanQueryMetadata,
  ScanQueryMetadataOptions,
  ScanQueryMetadataProvider,
  ScanRasterLevel,
  ScanSourceStatistics,
  ScanSpatialMetadata,
  TableScanReadOptions,
  TableScanSource,
  ScanQuery,
  FederatedTableBatch,
  FederatedTableBatchProvenance,
  FederatedTableScanExplain,
  FederatedTableScanSourceOptions,
  FederatedTableSchemaPolicy,
  FederatedTableSourceEntry,
  FederatedTableSourceExplain,
  VectorFeatureTableScanSourceOptions,
  VectorTableScanSourceOptions,
  VectorTileTableScanSourceOptions
} from './src/scan';

export {
  normalizeTableQuery,
  planLogicalTableQuery
} from './src/loader-utils/lib/scan-utils/logical-table-query';
export type {
  NormalizedTableSelection,
  NormalizedTableQuery,
  LogicalTableQueryProjectStep,
  LogicalTableQueryPlan
} from './src/scan';

export {projectArrowTable, filterArrowTable} from './src/scan/arrow-execution';
export type {ArrowFilterOptions} from './src/scan/arrow-execution';

export {query, queryInBatches} from './src/scan/query';
export type {Query, QueryOptions, SQLQueryParser} from './src/scan/query';

export type {TableReference, TableSourceCollection} from './src/scan';
