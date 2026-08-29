// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import {ArrowTable, ArrowTableBatch} from '@loaders.gl/arrow';

export {ParquetFormat} from './parquet-format';
export {AvroFormat} from './avro-format';

export type {ParquetLoaderOptions, ParquetJSLoaderOptions} from './parquet-loader-options';
export {ParquetLoader} from './parquet-loader-types';
export type {AvroLoaderOptions} from './avro-loader-types';
export {AvroLoader} from './avro-loader-types';
export {AvroWriter} from './avro-writer';
export type {AvroSchema, AvroWriterOptions} from './avro-writer';
export {encodeAvroInChunks} from './avro-stream';
export {parseAvroOCF} from './avro-ocf';
export {AvroSchemaLoader} from './avro-schema-loader-types';
export {GeoParquetLoader} from './geoparquet-loader';
export {ParquetJSLoader} from './parquet-js-loader-types';

export {ParquetSourceLoader} from './parquet-source-loader-types';
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
} from './parquet-source-types';
export {
  PARQUET_TABLE_QUERY_CAPABILITIES,
  PARQUET_SOURCE_CAPABILITIES,
  type ParquetSourceCapabilities
} from './parquet-source-capabilities';

export {ParquetWriter} from './parquet-writer';
export type {
  ParquetJSWriterEncoding,
  ParquetJSWriterOptions,
  ParquetSortingColumnOption,
  ParquetWriterEncryptionOptions,
  ParquetWriterFooterSignatureOptions
} from './parquet-js-writer';
export {ParquetJSWriter} from './parquet-js-writer';

export {
  decodeParquetColumnIndex,
  decodeParquetPageStatisticsValue,
  canUseParquetPageIndexForColumn,
  type ParquetPageStatistics
} from './lib/parquet-page-index';
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
} from './lib/parquet-encryption';

// EXPERIMENTAL - expose the internal parquetjs API

export {preloadCompressions} from './parquetjs/compression';

export {ParquetSchema} from './parquetjs/schema/schema';
export {ParquetReader} from './parquetjs/parser/parquet-reader';
export {ParquetEncoder} from './parquetjs/encoder/parquet-encoder';

export {
  convertParquetSchema,
  convertParquetSchema as convertParquetToArrowSchema
} from './lib/arrow/convert-schema-from-parquet';

export {
  checkParquetSplitBlockBloomFilter,
  decodeParquetSplitBlockBloomFilter,
  encodeParquetBloomFilterValue,
  encodeParquetSplitBlockBloomFilter,
  hashParquetBloomFilterValue,
  insertParquetSplitBlockBloomFilter,
  type ParquetBloomFilterPhysicalType,
  type ParquetSplitBlockBloomFilter
} from './lib/parquet-bloom-filter';
export {
  getParquetBloomFilterProbes,
  type ParquetBloomFilterProbe
} from './lib/parquet-bloom-filter-planner';
