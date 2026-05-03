// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {
  ArrowTable,
  ArrowTableBatch,
  GeoJSONTable,
  GeoJSONTableBatch
} from '@loaders.gl/schema';

import {ParquetFormat} from './parquet-format';
import {
  PARQUET_LOADER_DEFAULT_OPTIONS,
  type ParquetLoaderOptions as SharedParquetLoaderOptions
} from './parquet-loader-options';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for the GeoParquet loader. */
export type GeoParquetLoaderOptions = SharedParquetLoaderOptions;

/** Preloads the parser-bearing GeoParquet loader implementation. */
async function preloadGeoParquetLoader() {
  const {GeoParquetLoaderWithParser} = await import('./geoparquet-loader-with-parser');
  return GeoParquetLoaderWithParser;
}

/** Metadata-only GeoParquet table loader. */
export const GeoParquetLoader = {
  ...ParquetFormat,

  dataType: null as unknown as GeoJSONTable | ArrowTable,
  batchType: null as unknown as GeoJSONTableBatch | ArrowTableBatch,

  id: 'parquet',
  module: 'parquet',
  version: VERSION,
  worker: false,

  options: {
    parquet: {
      ...PARQUET_LOADER_DEFAULT_OPTIONS
    }
  },
  preload: preloadGeoParquetLoader
} as const satisfies Loader<
  GeoJSONTable | ArrowTable,
  GeoJSONTableBatch | ArrowTableBatch,
  GeoParquetLoaderOptions
>;
