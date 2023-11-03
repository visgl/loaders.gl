// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

export {Buffer} from './buffer-polyfill/install-buffer-polyfill';

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {
  ObjectRowTable,
  ObjectRowTableBatch,
  ColumnarTable,
  ColumnarTableBatch,
  GeoJSONTable,
  GeoJSONTableBatch
} from '@loaders.gl/schema';
// import type * as arrow from 'apache-arrow';

// ParquetLoader

import {BlobFile} from '@loaders.gl/loader-utils';
import {
  ParquetLoader as ParquetWorkerLoader,
  ParquetColumnarLoader as ParquetColumnarWorkerLoader,
  ParquetLoaderOptions
} from './parquet-loader';
import {parseParquetFile, parseParquetFileInBatches} from './lib/parsers/parse-parquet-to-rows';
import {
  parseParquetFileInColumns,
  parseParquetFileInColumnarBatches
} from './lib/parsers/parse-parquet-to-columns';

// import type {ParquetWasmLoaderOptions} from './lib/wasm/parse-parquet-wasm';
// import {parseParquetWasm} from './lib/wasm/parse-parquet-wasm';
// import {ParquetWasmLoader as ParquetWasmWorkerLoader} from './parquet-wasm-loader';

export {ParquetWorkerLoader};
// export {ParquetWasmWorkerLoader};

/** ParquetJS table loader */
export const ParquetLoader: LoaderWithParser<
  ObjectRowTable | GeoJSONTable,
  ObjectRowTableBatch | GeoJSONTableBatch,
  ParquetLoaderOptions
> = {
  ...ParquetWorkerLoader,
  parse(arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions) {
    return parseParquetFile(new BlobFile(arrayBuffer), options);
  },
  parseFile: parseParquetFile,
  parseFileInBatches: parseParquetFileInBatches
};

/** ParquetJS table loader */
export const ParquetColumnarLoader: LoaderWithParser<
  ColumnarTable,
  ColumnarTableBatch,
  ParquetLoaderOptions
> = {
  ...ParquetColumnarWorkerLoader,
  parse(arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions) {
    return parseParquetFileInColumns(new BlobFile(arrayBuffer), options);
  },
  parseFile: parseParquetFileInColumns,
  parseFileInBatches: parseParquetFileInColumnarBatches
};

// export const ParquetWasmLoader: LoaderWithParser<
//   arrow.Table,
//   never,
//   ParquetWasmLoaderOptions
// > = {
//   ...ParquetWasmWorkerLoader,
//   // @ts-expect-error Getting strange errors in wasm
//   parse: () => {} // parseParquetWasm
// };

// ParquetWriter

export {ParquetWriter as _ParquetWriter} from './parquet-writer';
// export {ParquetWasmWriter} from './parquet-wasm-writer';

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
export {BufferPolyfill, installBufferPolyfill} from './buffer-polyfill';
