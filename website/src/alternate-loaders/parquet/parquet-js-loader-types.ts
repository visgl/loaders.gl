// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/core/loader-utils';
import type {Table, RecordBatch} from 'apache-arrow';
import type {ObjectRowTable, ObjectRowTableBatch} from '@loaders.gl/core/schema';

import {ParquetFormat} from '../../../../modules/tables/src/parquet/parquet-format';
import type {ParquetLoaderOptions} from '../../../../modules/tables/src/parquet/parquet-loader-options';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Default option bag for the experimental TypeScript-backed Parquet loader. */
const DEFAULT_PARQUET_JS_OPTIONS = {
  columns: undefined,
  preserveBinary: false,
  verifyFooterSignature: true,
  shape: 'arrow' as const
};

/** Preloads the parser-bearing TypeScript Parquet loader implementation. */
async function preloadParquetJSLoader() {
  const {ParquetJSLoaderWithParser} = await import('./parquet-js-loader');
  return ParquetJSLoaderWithParser;
}

/** Metadata-only Parquet loader backed by the experimental TypeScript implementation. */
export const ParquetJSLoader = {
  defaultShape: 'arrow',
  supportsNativeArrow: true,
  ...ParquetFormat,

  dataType: null as unknown as ObjectRowTable | Table,
  batchType: null as unknown as ObjectRowTableBatch | RecordBatch,

  id: 'parquet-js',
  module: 'tables',
  version: VERSION,
  worker: false,
  options: {
    parquet: DEFAULT_PARQUET_JS_OPTIONS
  },
  preload: preloadParquetJSLoader
} as const satisfies Loader<
  ObjectRowTable | Table,
  ObjectRowTableBatch | RecordBatch,
  ParquetLoaderOptions
>;
