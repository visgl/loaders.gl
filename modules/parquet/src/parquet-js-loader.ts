// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {ObjectRowTable, ObjectRowTableBatch} from '@loaders.gl/schema';

import {ParquetFormat} from './parquet-format';
import type {ParquetJSLoaderOptions} from './parquet-loader-options';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Default option bag for the experimental parquetjs plain-row loader. */
const DEFAULT_PARQUET_JS_OPTIONS = {
  columns: undefined,
  implementation: 'js' as const,
  preserveBinary: false
};

/** Preloads the parser-bearing parquetjs loader implementation. */
async function preload() {
  const {ParquetJSLoaderWithParser} = await import('./parquet-js-loader-with-parser');
  return ParquetJSLoaderWithParser;
}

/** Metadata-only plain-row Parquet loader backed by the experimental parquetjs implementation. */
export const ParquetJSLoader = {
  ...ParquetFormat,

  dataType: null as unknown as ObjectRowTable,
  batchType: null as unknown as ObjectRowTableBatch,

  id: 'parquet-js',
  module: 'parquet',
  version: VERSION,
  worker: false,
  options: {
    parquet: DEFAULT_PARQUET_JS_OPTIONS
  },
  preload
} as const satisfies Loader<ObjectRowTable, ObjectRowTableBatch, ParquetJSLoaderOptions>;
