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

export {ParquetSchema} from './parquetjs/schema/schema';
export {ParquetReader} from './parquetjs/parser/parquet-reader';
export {ParquetEnvelopeReader} from './parquetjs/parser/parquet-envelope-reader';
// export {ParquetWriter, ParquetEnvelopeWriter, ParquetTransformer} from './parquetjs/encoder/writer';
export {convertParquetToArrowSchema} from './lib/convert-schema';

// TESTS
export const _typecheckParquetLoader: LoaderWithParser = ParquetLoader;
