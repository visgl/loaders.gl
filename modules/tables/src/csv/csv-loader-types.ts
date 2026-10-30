// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/core/loader-utils';
import type {
  ArrayRowTable,
  ArrowTable,
  ArrowTableBatch,
  ColumnarTable,
  ColumnarTableBatch,
  ObjectRowTable,
  TableBatch
} from '@loaders.gl/core/schema';
import {CSVFormat} from './csv-format';
import {CSV_LOADER_OPTIONS, CSV_LOADER_VERSION, type CSVLoaderOptions} from './csv-loader-options';

export type {CSVLoaderOptions} from './csv-loader-options';

/** Preloads the parser-bearing CSV loader implementation. */
async function preloadCSVLoader() {
  const {CSVLoaderWithParser} = await import('@loaders.gl/tables/csv-loader');
  return CSVLoaderWithParser;
}

/** Metadata-only loader for CSV and other delimiter-separated tables. */
export const CSVLoader = {
  ...CSVFormat,
  dataType: null as unknown as ObjectRowTable | ArrayRowTable | ColumnarTable | ArrowTable,
  batchType: null as unknown as TableBatch | ColumnarTableBatch | ArrowTableBatch,
  version: CSV_LOADER_VERSION,
  text: true,
  worker: true,
  workerInBatches: true,
  options: CSV_LOADER_OPTIONS,
  preload: preloadCSVLoader
} as const satisfies Loader<
  ObjectRowTable | ArrayRowTable | ColumnarTable | ArrowTable,
  TableBatch | ColumnarTableBatch | ArrowTableBatch,
  CSVLoaderOptions
>;
