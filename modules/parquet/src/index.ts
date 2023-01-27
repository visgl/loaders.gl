// loaders.gl, MIT license

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {Table as ArrowTable} from 'apache-arrow';

// ParquetLoader

import {ParquetLoader as ParquetWorkerLoader, ParquetLoaderOptions} from './parquet-loader';
import {parseParquet, parseParquetFileInBatches} from './lib/parse-parquet';

import {parseParquetWasm, ParquetWasmLoaderOptions} from './lib/wasm/parse-parquet-wasm';
import {ParquetWasmLoader as ParquetWasmWorkerLoader} from './parquet-wasm-loader';

import {
  parseParquetInColumns,
  parseParquetFileInColumnarBatches
} from './lib/parsers/parse-parquet-to-columns';

export {ParquetWorkerLoader, ParquetWasmWorkerLoader};

/** ParquetJS table loader */
export const ParquetLoader: LoaderWithParser<any[][], any[][], ParquetLoaderOptions> = {
  ...ParquetWorkerLoader,
  parse: parseParquet,
  parseFileInBatches: parseParquetFileInBatches
};

/** ParquetJS table loader */
export const ParquetColumnarLoader = {
  ...ParquetWorkerLoader,
  parse: parseParquetInColumns,
  parseFileInBatches: parseParquetFileInColumnarBatches
};

export const ParquetWasmLoader = {
export const ParquetWasmLoader: LoaderWithParser<ArrowTable, never, ParquetWasmLoaderOptions> = {
  ...ParquetWasmWorkerLoader,
  parse: parseParquetWasm
};

// ParquetWriter

export {ParquetWriter as _ParquetWriter} from './parquet-writer';
export {ParquetWasmWriter} from './parquet-wasm-writer';

// EXPERIMENTAL - expose the internal parquetjs API

export {preloadCompressions} from './parquetjs/compression';

export {ParquetSchema} from './parquetjs/schema/schema';
export {ParquetReader} from './parquetjs/parser/parquet-reader';
export {ParquetEncoder} from './parquetjs/encoder/parquet-encoder';

export {
  convertSchemaFromParquet,
  convertSchemaFromParquet as convertParquetToArrowSchema
} from './lib/arrow/convert-schema-from-parquet';

// TESTS
export const _typecheckParquetLoader: LoaderWithParser = ParquetLoader;

// Geo Metadata
export {default as geoJSONSchema} from './lib/geo/geoparquet-schema';

export type {GeoMetadata} from './lib/geo/decode-geo-metadata';
export {getGeoMetadata, setGeoMetadata, unpackGeoMetadata} from './lib/geo/decode-geo-metadata';
