// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/loader-utils';

import {decodeParquetSourceWorkerInput} from '../lib/parquet-source-worker-decoder';
import {isParquetSourceWorkerInput} from '../lib/parquet-source-worker-types';
import {PARQUET_LOADER_BASE} from '../parquet-loader-base';

/** Worker-local parser for one selective Parquet source row-group job. */
const ParquetSourceWorkerLoader = {
  ...PARQUET_LOADER_BASE,
  id: 'parquet-source',
  name: 'ParquetSource',
  parse(input: unknown) {
    if (!isParquetSourceWorkerInput(input)) {
      throw new Error('Parquet source worker received an unsupported operation');
    }
    return decodeParquetSourceWorkerInput(input);
  }
};

createLoaderWorker(ParquetSourceWorkerLoader);
