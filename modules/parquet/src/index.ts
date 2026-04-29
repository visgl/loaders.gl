// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import {ArrowTable, ArrowTableBatch} from '@loaders.gl/arrow';

export {ParquetFormat} from './parquet-format';

export type {ParquetLoaderOptions, ParquetJSLoaderOptions} from './parquet-loader-options';
export {ParquetLoader} from './parquet-loader';
export {GeoParquetLoader} from './geoparquet-loader';
export {ParquetJSLoader} from './parquet-js-loader';

export {ParquetWriter} from './parquet-writer';
export type {ParquetJSWriterOptions} from './parquet-js-writer';
export {ParquetJSWriter} from './parquet-js-writer';

// Arrow-first Parquet APIs

export type {ParquetArrowLoaderOptions} from './parquet-arrow-loader';
export {ParquetArrowLoader} from './parquet-arrow-loader';
export {ParquetArrowWriter} from './parquet-arrow-writer';

// EXPERIMENTAL - expose the internal parquetjs API

export {preloadCompressions} from './parquetjs/compression';

export {ParquetSchema} from './parquetjs/schema/schema';
export {ParquetReader} from './parquetjs/parser/parquet-reader';
export {ParquetEncoder} from './parquetjs/encoder/parquet-encoder';

export {
  convertParquetSchema,
  convertParquetSchema as convertParquetToArrowSchema
} from './lib/arrow/convert-schema-from-parquet';

// DEPRECATED EXPORTS
/** @deprecated Use ParquetArrowLoader. */
export {ParquetArrowWorkerLoader} from './parquet-arrow-loader';
