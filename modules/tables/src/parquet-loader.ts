// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ParquetLoaderWithParser as ParquetParser} from './parquet/parquet-loader.js';
import {ParquetSourceLoaderWithParser} from './parquet/parquet-source-loader.js';

export type {ParquetLoaderOptions} from './parquet/parquet-loader.js';
export {getParquetOptions} from './parquet/parquet-loader.js';

/** Parquet parser and reusable source factory. */
export const ParquetLoaderWithParser = {
  ...ParquetParser,
  createDataSourceSync: ParquetSourceLoaderWithParser.createDataSourceSync
};
