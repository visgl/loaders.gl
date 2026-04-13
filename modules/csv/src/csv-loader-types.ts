// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {ArrayRowTable, ObjectRowTable, TableBatch} from '@loaders.gl/schema';
import {CSVFormat} from './csv-format';
import {
  CSV_LOADER_OPTIONS,
  CSV_LOADER_VERSION,
  type CSVLoaderOptions
} from './csv-loader-options';

export type {CSVLoaderOptions} from './csv-loader-options';

async function preload() {
  const {CSVLoaderWithParser} = await import('@loaders.gl/csv/csv-loader');
  return CSVLoaderWithParser;
}

export const CSVLoader = {
  ...CSVFormat,
  dataType: null as unknown as ObjectRowTable | ArrayRowTable,
  batchType: null as unknown as TableBatch,
  version: CSV_LOADER_VERSION,
  options: CSV_LOADER_OPTIONS,
  preload
} as const satisfies Loader<ObjectRowTable | ArrayRowTable, TableBatch, CSVLoaderOptions>;

/** @deprecated Use CSVLoader. */
export const CSVWorkerLoader = CSVLoader;
