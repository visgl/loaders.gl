// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import {ArrowTable, ArrowTableBatch} from '@loaders.gl/arrow';

export {ParquetFormat} from './parquet-format';

export type {ParquetLoaderOptions, ParquetJSLoaderOptions} from './parquet-loader-options';
export {ParquetLoader} from './parquet-loader-types';
export {GeoParquetLoader} from './geoparquet-loader';
export {ParquetJSLoader} from './parquet-js-loader-types';

export {ParquetSourceLoader} from './parquet-source-loader-types';
export type {
  ParquetBatch,
  ParquetBatchMetadata,
  ParquetBatchProvenance,
  ParquetColumnChunkMetadata,
  ParquetColumnChunkStatistics,
  ParquetDatasetBatch,
  ParquetDatasetBatchProvenance,
  ParquetDatasetBoundingBox,
  ParquetDatasetFile,
  ParquetDatasetFileCollection,
  ParquetDatasetFileProvider,
  ParquetDatasetFileQuery,
  ParquetDatasetFiles,
  ParquetDatasetPartitionValue,
  ParquetDatasetReadOptions,
  ParquetDatasetSourceOptions,
  ParquetDatasetTelemetry,
  ParquetMetadataRequestOptions,
  ParquetObjectVersion,
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
  ParquetSourceBatch,
  ParquetSourceLoaderOptions,
  ParquetSourceMetadata,
  ParquetSourceReadOptions,
  ParquetTelemetry,
  ParquetTelemetryEvent
} from './parquet-source-types';
export {
  PARQUET_SOURCE_CAPABILITIES,
  type ParquetSourceCapabilities
} from './parquet-source-capabilities';

export {ParquetWriter} from './parquet-writer';
export type {ParquetJSWriterEncoding, ParquetJSWriterOptions} from './parquet-js-writer';
export {ParquetJSWriter} from './parquet-js-writer';

// EXPERIMENTAL - expose the internal parquetjs API

export {preloadCompressions} from './parquetjs/compression';

export {ParquetSchema} from './parquetjs/schema/schema';
export {ParquetReader} from './parquetjs/parser/parquet-reader';
export {ParquetEncoder} from './parquetjs/encoder/parquet-encoder';

export {
  convertParquetSchema,
  convertParquetSchema as convertParquetToArrowSchema
} from './lib/arrow/convert-schema-from-parquet';
