import type {LoaderWithParser} from '@loaders.gl/loader-utils';

// ParquetLoader

import {GeoParquetLoader as GeoParquetWorkerLoader} from './parquet-loader';
import {ParquetLoader as ParquetWorkerLoader} from './parquet-loader';
import {parseParquet, parseParquetFileInBatches} from './lib/parse-parquet';
import {parseGeoParquet} from './lib/parse-geoparquet';

export {ParquetWorkerLoader, GeoParquetWorkerLoader};

/** ParquetJS table loader */
export const ParquetLoader = {
  ...ParquetWorkerLoader,
  parse: parseParquet,
  parseFileInBatches: parseParquetFileInBatches
};

export const GeoParquetLoader = {
  ...GeoParquetWorkerLoader,
  parse: parseGeoParquet
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
