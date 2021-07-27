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

export {preloadCompressions} from './parquetjs/compression';

export {ParquetEnvelopeReader} from './parquetjs/classes/parquet-envelope-reader';
export {ParquetReader} from './parquetjs/classes/parquet-reader';
export {ParquetWriter, ParquetEnvelopeWriter, ParquetTransformer} from './parquetjs/writer';
export {ParquetSchema} from './parquetjs/schema/schema';
export {convertParquetToArrowSchema} from './lib/convert-schema';

// TESTS
export const _typecheckParquetLoader: LoaderWithParser = ParquetLoader;
