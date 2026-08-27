// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {
  ArrowTable,
  ArrowTableBatch,
  ObjectRowTable,
  ObjectRowTableBatch
} from '@loaders.gl/schema';

import {ParquetFormat} from './parquet-format';
import type {ParquetJSLoaderOptions} from './parquet-loader-options';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Default option bag for the experimental parquetjs plain-row loader. */
const DEFAULT_PARQUET_JS_OPTIONS = {
  columns: undefined,
  preserveBinary: false,
  verifyFooterSignature: true,
  shape: 'object-row-table' as const
};

/** Preloads the parser-bearing TypeScript Parquet loader implementation. */
async function preloadParquetJSLoader() {
  const {ParquetJSLoaderWithParser} = await import('@loaders.gl/parquet/parquet-js-loader');
  return ParquetJSLoaderWithParser;
}

/** Metadata-only Parquet loader backed by the experimental TypeScript implementation. */
export const ParquetJSLoader = {
  ...ParquetFormat,

  dataType: null as unknown as ObjectRowTable | ArrowTable,
  batchType: null as unknown as ObjectRowTableBatch | ArrowTableBatch,

  id: 'parquet-js',
  module: 'parquet',
  version: VERSION,
  worker: false,
  options: {
    parquet: DEFAULT_PARQUET_JS_OPTIONS
  },
  preload: preloadParquetJSLoader
} as const satisfies Loader<
  ObjectRowTable | ArrowTable,
  ObjectRowTableBatch | ArrowTableBatch,
  ParquetJSLoaderOptions
>;
