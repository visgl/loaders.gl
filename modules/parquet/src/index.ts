// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {Buffer} from './polyfills/buffer/install-buffer-polyfill';

// import {ArrowTable, ArrowTableBatch} from '@loaders.gl/arrow';

export {
  ParquetWorkerLoader,
  ParquetLoader,
  GeoParquetWorkerLoader,
  GeoParquetLoader,
  ParquetColumnarWorkerLoader,
  ParquetColumnarLoader
} from './parquet-loader';

export {ParquetWriter as _ParquetWriter} from './parquet-writer';

// EXPERIMENTAL - expose Parquet WASM loaders/writer

export type {ParquetWasmLoaderOptions} from './parquet-wasm-loader';
export {ParquetWasmLoader, ParquetWasmWorkerLoader} from './parquet-wasm-loader';
export {ParquetWasmWriter} from './parquet-wasm-writer';

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
