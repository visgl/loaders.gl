// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {
  ArrayRowTable,
  ArrowTable,
  ArrowTableBatch,
  ColumnarTable,
  ColumnarTableBatch,
  ObjectRowTable,
  TableBatch
} from '@loaders.gl/schema';
import {CSVFormat} from './csv-format';
import {CSV_LOADER_OPTIONS, CSV_LOADER_VERSION, type CSVLoaderOptions} from './csv-loader-options';

export type {CSVLoaderOptions} from './csv-loader-options';

async function preload() {
  const {CSVLoaderWithParser} = await import('@loaders.gl/csv/csv-loader');
  return CSVLoaderWithParser;
}

export const CSVLoader = {
  ...CSVFormat,
  dataType: null as unknown as ObjectRowTable | ArrayRowTable | ColumnarTable | ArrowTable,
  batchType: null as unknown as TableBatch | ColumnarTableBatch | ArrowTableBatch,
  version: CSV_LOADER_VERSION,
  text: true,
  options: CSV_LOADER_OPTIONS,
  preload
} as const satisfies Loader<
  ObjectRowTable | ArrayRowTable | ColumnarTable | ArrowTable,
  TableBatch | ColumnarTableBatch | ArrowTableBatch,
  CSVLoaderOptions
>;

/** @deprecated Use CSVLoader. */
export const CSVWorkerLoader = CSVLoader;
