import type {LoaderWithParser} from '@loaders.gl/loader-utils';

// ParquetLoader

import {ParquetWasmLoader as ParquetWasmWorkerLoader} from './parquet-wasm-loader';
import {ParquetLoader as ParquetWorkerLoader} from './parquet-loader';
import {parseParquet, parseParquetFileInBatches} from './lib/parse-parquet';
import {parseParquet as parseParquetWasm} from './lib/wasm/parse-parquet-wasm';

export {ParquetWorkerLoader, ParquetWasmWorkerLoader};

/** ParquetJS table loader */
export const ParquetLoader = {
  ...ParquetWorkerLoader,
  parse: parseParquet,
  parseFileInBatches: parseParquetFileInBatches
};

export const ParquetWasmLoader = {
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

export {convertParquetToArrowSchema} from './lib/convert-schema';

export type {ReadableFile} from './parquetjs/parser/readable-file';
export {makeReadableFile} from './parquetjs/parser/readable-file';

// TESTS
export const _typecheckParquetLoader: LoaderWithParser = ParquetLoader;
