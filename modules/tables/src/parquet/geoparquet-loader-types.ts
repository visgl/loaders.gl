// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/core/loader-utils';
import type {Table, RecordBatch} from 'apache-arrow';
import type {GeoJSONTable, GeoJSONTableBatch} from '@loaders.gl/core/schema';

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
  const {GeoParquetLoaderWithParser} = await import('@loaders.gl/tables/geoparquet-loader');
  return GeoParquetLoaderWithParser;
}

/** Metadata-only GeoParquet table loader. */
export const GeoParquetLoader = {
  defaultShape: 'arrow',
  supportsNativeArrow: true,
  ...ParquetFormat,

  dataType: null as unknown as GeoJSONTable | Table,
  batchType: null as unknown as GeoJSONTableBatch | RecordBatch,

  id: 'parquet',
  module: 'tables',
  version: VERSION,
  worker: false,

  options: {
    parquet: {
      ...PARQUET_LOADER_DEFAULT_OPTIONS
    }
  },
  preload: preloadGeoParquetLoader
} as const satisfies Loader<
  GeoJSONTable | Table,
  GeoJSONTableBatch | RecordBatch,
  GeoParquetLoaderOptions
>;
