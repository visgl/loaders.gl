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
// import type {Table as ApacheArrowTable} from 'apache-arrow';

// ParquetLoader

import {
  ParquetLoader as ParquetWorkerLoader,
  ParquetLoader as ParquetColumnarWorkerLoader,
  ParquetLoaderOptions
} from './parquet-loader';
import {parseParquet, parseParquetFileInBatches} from './lib/parsers/parse-parquet-to-rows';
import {
  parseParquetInColumns,
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
  parse: parseParquet,
  // @ts-expect-error
  parseFileInBatches: parseParquetFileInBatches
};

/** ParquetJS table loader */
export const ParquetColumnarLoader: LoaderWithParser<
  ColumnarTable,
  ColumnarTableBatch,
  ParquetLoaderOptions
> = {
  ...ParquetColumnarWorkerLoader,
  parse: parseParquetInColumns,
  // @ts-expect-error
  parseFileInBatches: parseParquetFileInColumnarBatches
};

// export const ParquetWasmLoader: LoaderWithParser<
//   ApacheArrowTable,
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

// Geo Metadata
// import {default as GEOPARQUET_METADATA_SCHEMA} from './lib/geo/geoparquet-metadata-schema.json';
// export {GEOPARQUET_METADATA_SCHEMA};
export {GEOPARQUET_METADATA_JSON_SCHEMA} from './lib/geo/geoparquet-metadata-schema';

export type {GeoMetadata} from './lib/geo/decode-geo-metadata';
export {getGeoMetadata, setGeoMetadata, unpackGeoMetadata} from './lib/geo/decode-geo-metadata';

// Experimental
export {BufferPolyfill, installBufferPolyfill} from './buffer-polyfill';
