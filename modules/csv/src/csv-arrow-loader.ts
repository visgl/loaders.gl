// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import {CSVFormat} from './csv-format';
import {CSV_ARROW_LOADER_OPTIONS, type CSVArrowLoaderOptions} from './csv-arrow-loader-options';
import {CSV_LOADER_VERSION} from './csv-loader-options';

export type {CSVArrowLoaderOptions} from './csv-arrow-loader-options';

async function preload() {
  const {CSVArrowLoaderWithParser} = await import('./csv-arrow-loader-with-parser');
  return CSVArrowLoaderWithParser;
}

export const CSVArrowLoader = {
  ...CSVFormat,
  name: 'CSVArrow',
  dataType: null as unknown as ArrowTable,
  batchType: null as unknown as ArrowTableBatch,
  version: CSV_LOADER_VERSION,
  text: true,
  options: CSV_ARROW_LOADER_OPTIONS,
  preload
} as const satisfies Loader<ArrowTable, ArrowTableBatch, CSVArrowLoaderOptions>;
