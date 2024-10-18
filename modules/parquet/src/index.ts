// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {Buffer} from './polyfills/buffer/install-buffer-polyfill';

// import {ArrowTable, ArrowTableBatch} from '@loaders.gl/arrow';

export {ParquetFormat} from './parquet-format';

export {
  ParquetJSONWorkerLoader,
  ParquetJSONLoader,
  GeoParquetWorkerLoader,
  GeoParquetLoader,
  // deprecated
  ParquetJSONWorkerLoader as ParquetWorkerLoader,
  ParquetJSONLoader as ParquetLoader
} from './parquet-json-loader';

export {
  ParquetJSONWriter as _ParquetJSONWriter,
  // deprecated
  ParquetJSONWriter as ParquetWriter
} from './parquet-json-writer';

// EXPERIMENTAL - expose Parquet WASM loaders/writer

export type {ParquetArrowLoaderOptions} from './parquet-arrow-loader';
export {ParquetArrowLoader, ParquetArrowWorkerLoader} from './parquet-arrow-loader';
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

// Experimental
export {BufferPolyfill, installBufferPolyfill} from './polyfills/buffer/index';
