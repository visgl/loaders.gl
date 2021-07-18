import type {LoaderWithParser} from '@loaders.gl/loader-utils';

// ParquetLoader

import {ParquetLoader as ParquetWorkerLoader} from './parquet-loader';
import {parseParquet, parseParquetFileInBatches} from './lib/parse-parquet';

export {ParquetWorkerLoader};

/** ParquetJS table loader */
export const ParquetLoader = {
  ...ParquetWorkerLoader,
  parse: parseParquet,
  parseFileInBatches: parseParquetFileInBatches
};

// ParquetWriter

export {ParquetWriter as _ParquetWriter} from './parquet-writer';

// EXPERIMENTAL - expose the internal parquetjs API

export {ParquetReader, ParquetEnvelopeReader} from './parquetjs/reader';
export {ParquetWriter, ParquetEnvelopeWriter, ParquetTransformer} from './parquetjs/writer';
export {ParquetSchema} from './parquetjs/schema/schema';

// TESTS
export const _typecheckParquetLoader: LoaderWithParser = ParquetLoader;
