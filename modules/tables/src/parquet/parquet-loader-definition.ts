// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/core/loader-utils';
import type {Table, RecordBatch} from 'apache-arrow';
import type {ObjectRowTable, ObjectRowTableBatch} from '@loaders.gl/core/schema';

import {PARQUET_LOADER_BASE} from './parquet-loader-base';
import type {ParquetLoaderOptions as SharedParquetLoaderOptions} from './parquet-loader-options';
import {PARQUET_WORKER_URL} from './parquet-worker-url';

/** Options for the Parquet loader. */
export type ParquetLoaderOptions = SharedParquetLoaderOptions;

/** Shared Parquet loader metadata for the caller and worker. */
export const ParquetLoaderDefinition = {
  fetchBeforePreload: true,
  defaultShape: 'arrow',
  supportsNativeArrow: true,
  ...PARQUET_LOADER_BASE,
  worker: PARQUET_WORKER_URL,
  workerInBatches: true,
  fromUrl: true,
  fromBlob: true
} as const satisfies Loader<
  ObjectRowTable | Table,
  ObjectRowTableBatch | RecordBatch,
  ParquetLoaderOptions
>;
