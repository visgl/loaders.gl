// loaders.gl, MIT license

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {Table as ArrowTable} from 'apache-arrow';

// ParquetLoader

import {ParquetWasmLoader as ParquetWasmWorkerLoader} from './parquet-wasm-loader';
import {ParquetLoader as ParquetWorkerLoader, ParquetLoaderOptions} from './parquet-loader';
import {parseParquet, parseParquetFileInBatches} from './lib/parse-parquet';
import {parseParquetWasm, ParquetWasmLoaderOptions} from './lib/wasm/parse-parquet-wasm';

export {ParquetWorkerLoader, ParquetWasmWorkerLoader};

/** ParquetJS table loader */
export const ParquetLoader: LoaderWithParser<any[][], any[][], ParquetLoaderOptions> = {
  ...ParquetWorkerLoader,
  parse: parseParquet,
  parseFileInBatches: parseParquetFileInBatches
};

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
export {ParquetEnvelopeReader} from './parquetjs/parser/parquet-envelope-reader';
// export {ParquetWriter, ParquetEnvelopeWriter, ParquetTransformer} from './parquetjs/encoder/writer';
export {convertParquetSchema} from './lib/convert-schema';

// TESTS
export const _typecheckParquetLoader: LoaderWithParser = ParquetLoader;
