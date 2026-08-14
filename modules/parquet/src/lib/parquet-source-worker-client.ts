// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import {canParseWithWorker, parseWithWorker} from '@loaders.gl/loader-utils';

import {PARQUET_LOADER_BASE} from '../parquet-loader-base';
import {PARQUET_SOURCE_WORKER_URL} from '../parquet-source-worker-url';
import type {
  ParquetSourceWorkerInput,
  ParquetSourceWorkerOptions,
  ParquetSourceWorkerResult
} from './parquet-source-worker-types';

/** Private worker descriptor using the package-local selective source worker bundle. */
const PARQUET_SOURCE_WORKER: Loader = {
  ...PARQUET_LOADER_BASE,
  id: 'parquet-source',
  name: 'ParquetSource',
  worker: PARQUET_SOURCE_WORKER_URL
};

/** Returns whether this runtime and option set can decode Parquet source rows on a worker. */
export function canDecodeParquetSourceOnWorker(options: ParquetSourceWorkerOptions): boolean {
  return canParseWithWorker(PARQUET_SOURCE_WORKER, options);
}

/** Sends selected compressed Parquet chunks to a worker and returns transferable Arrow buffers. */
export async function decodeParquetSourceRowGroupOnWorker(
  input: ParquetSourceWorkerInput,
  options: ParquetSourceWorkerOptions
): Promise<ParquetSourceWorkerResult> {
  return (await parseWithWorker(
    PARQUET_SOURCE_WORKER,
    input,
    options
  )) as ParquetSourceWorkerResult;
}
