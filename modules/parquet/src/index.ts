// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import {ArrowTable, ArrowTableBatch} from '@loaders.gl/arrow';

export {ParquetFormat} from '@loaders.gl/tables/parquet/index';

export type {ParquetLoaderOptions, ParquetJSLoaderOptions} from '@loaders.gl/tables/parquet/index';
export {ParquetLoader} from '@loaders.gl/tables/parquet/index';
export {GeoParquetLoader} from '@loaders.gl/tables/parquet/index';

export {ParquetSourceLoader} from '@loaders.gl/tables/parquet/index';
export type {
  ParquetDeferredPageFilter,
  ParquetEncodedColumnChunk,
  ParquetEncodedPage,
  ParquetEncodedPageBatch,
  ParquetEncodedPageReadOptions,
  ParquetEncodedPageSection,
  ParquetPageCompressionState
} from '@loaders.gl/tables/parquet/index';
export type {
  ParquetBatch,
  ParquetBatchMetadata,
  ParquetBatchProvenance,
  ParquetBoundingBox,
  ParquetColumnChunkMetadata,
  ParquetColumnChunkStatistics,
  ParquetColumnChunkSizeStatistics,
  ParquetGeospatialBoundingBox,
  ParquetGeospatialStatistics,
  ParquetDatasetBatch,
  ParquetDatasetBatchProvenance,
  ParquetDatasetBoundingBox,
  ParquetDatasetExplain,
  ParquetDatasetFile,
  ParquetDatasetFileCollection,
  ParquetDatasetFileScanPlan,
  ParquetDatasetFileProvider,
  ParquetDatasetFileQuery,
  ParquetDatasetFiles,
  ParquetDatasetPartitionValue,
  ParquetDatasetReadOptions,
  ParquetDatasetSourceOptions,
  ParquetDatasetTelemetry,
  ParquetMetadataRequestOptions,
  ParquetObjectVersion,
  ParquetPageScanPlan,
  ParquetComparisonPredicate,
  ParquetInPredicate,
  ParquetLogicalPredicate,
  ParquetNotPredicate,
  ParquetNullPredicate,
  ParquetPredicate,
  ParquetPredicateProperty,
  ParquetPredicateValue,
  ParquetRangeRequestOptions,
  ParquetReadOptions,
  ParquetRowGroupMetadata,
  ParquetSortingColumn,
  ParquetSourceBatch,
  ParquetSourceLoaderOptions,
  ParquetSourceMetadata,
  ParquetSourceReadOptions,
  ParquetSourceExplain,
  ParquetTelemetry,
  ParquetTelemetryEvent
} from '@loaders.gl/tables/parquet/index';
export {
  PARQUET_TABLE_QUERY_CAPABILITIES,
  PARQUET_SOURCE_CAPABILITIES,
  type ParquetSourceCapabilities
} from '@loaders.gl/tables/parquet/index';

export {ParquetWriter} from '@loaders.gl/tables/parquet/index';
export type {
  ParquetJSWriterEncoding,
  ParquetJSWriterOptions,
  ParquetSortingColumnOption,
  ParquetWriterEncryptionOptions,
  ParquetWriterFooterSignatureOptions
} from '@loaders.gl/tables/parquet/index';
export {ParquetJSWriter} from '@loaders.gl/tables/parquet/index';

export {
  decodeParquetColumnIndex,
  decodeParquetPageStatisticsValue,
  canUseParquetPageIndexForColumn,
  type ParquetPageStatistics
} from '@loaders.gl/tables/parquet/index';
export {
  createParquetModuleAad,
  decryptParquetModule,
  encryptParquetModule,
  createParquetFooterSignature,
  readParquetEncryptedModule,
  verifyParquetFooterSignature,
  type ParquetDecryptModuleOptions,
  type ParquetEncryptionAlgorithm,
  type ParquetKeyRetriever
} from '@loaders.gl/tables/parquet/index';

// EXPERIMENTAL - expose the internal parquetjs API

export {preloadCompressions} from '@loaders.gl/tables/parquet/index';

export {ParquetSchema} from '@loaders.gl/tables/parquet/index';
export {ParquetReader} from '@loaders.gl/tables/parquet/index';
export {ParquetEncoder} from '@loaders.gl/tables/parquet/index';

export {
  convertParquetSchema,
  convertParquetSchema as convertParquetToArrowSchema
} from '@loaders.gl/tables/parquet/index';

export {
  checkParquetSplitBlockBloomFilter,
  decodeParquetSplitBlockBloomFilter,
  encodeParquetBloomFilterValue,
  encodeParquetSplitBlockBloomFilter,
  hashParquetBloomFilterValue,
  insertParquetSplitBlockBloomFilter,
  type ParquetBloomFilterPhysicalType,
  type ParquetSplitBlockBloomFilter
} from '@loaders.gl/tables/parquet/index';
export {
  getParquetBloomFilterProbes,
  type ParquetBloomFilterProbe
} from '@loaders.gl/tables/parquet/index';
