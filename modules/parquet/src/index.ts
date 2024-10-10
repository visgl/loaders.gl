// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {Buffer} from './polyfills/buffer/install-buffer-polyfill';

// import {ArrowTable, ArrowTableBatch} from '@loaders.gl/arrow';

export {
  ParquetJSONWorkerLoader,
  ParquetJSONLoader,
  GeoParquetWorkerLoader,
  GeoParquetLoader,
  ParquetJSONColumnarWorkerLoader,
  ParquetJSONColumnarLoader
} from './parquet-json-loader';

export {ParquetJSONWriter as _ParquetJSONWriter} from './parquet-json-writer';

// EXPERIMENTAL - expose Parquet WASM loaders/writer

export type {ParquetLoaderOptions} from './parquet-loader';
export {ParquetLoader, ParquetWorkerLoader} from './parquet-loader';
export {ParquetWriter} from './parquet-writer';

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
