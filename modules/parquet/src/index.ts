// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import {ArrowTable, ArrowTableBatch} from '@loaders.gl/arrow';

export {ParquetFormat} from './parquet-format';

export type {ParquetLoaderOptions, ParquetJSLoaderOptions} from './parquet-loader-options';
export {ParquetLoader} from './parquet-loader';
export {GeoParquetLoader} from './geoparquet-loader';
export {ParquetJSLoader} from './parquet-js-loader';

export {ParquetSourceLoader} from './parquet-source-loader-types';
export type {
  ParquetSourceLoaderOptions,
  ParquetSourceReadOptions,
  ParquetSourceMetadata,
  ParquetRowGroupMetadata,
  ParquetColumnChunkMetadata,
  ParquetBatchMetadata,
  ParquetSourceBatch
} from './parquet-source-types';

export {ParquetWriter} from './parquet-writer';
export type {ParquetJSWriterOptions} from './parquet-js-writer';
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
