// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ArrowTable, RecordBatch as ArrowTableBatch} from 'apache-arrow';
import type {Loader} from '@loaders.gl/core/loader-utils';
import type {
  ArrayRowTable,
  ColumnarTable,
  ColumnarTableBatch,
  ObjectRowTable,
  TableBatch
} from '@loaders.gl/core/schema';
import {CSVFormat} from './csv-format';
import {CSV_LOADER_OPTIONS, CSV_LOADER_VERSION, type CSVLoaderOptions} from './csv-loader-options';

export type {CSVLoaderOptions} from './csv-loader-options';

const sourceMetadata = {
  type: 'csv-source',
  fromUrl: true,
  fromBlob: true,
  defaultOptions: {},
  testURL: (url: string): boolean => /\.(?:csv|tsv|dsv)(?:$|[?#])/i.test(url)
} as const;

/** Shared CSV loader metadata for the caller and worker. */
export const CSVLoaderDefinition = {
  fetchBeforePreload: true,
  ...sourceMetadata,
  defaultShape: 'arrow',
  supportsNativeArrow: true,
  ...CSVFormat,
  dataType: null as unknown as ObjectRowTable | ArrayRowTable | ColumnarTable | ArrowTable,
  batchType: null as unknown as TableBatch | ColumnarTableBatch | ArrowTableBatch,
  version: CSV_LOADER_VERSION,
  text: true,
  worker: true,
  workerInBatches: true,
  options: CSV_LOADER_OPTIONS
} as const satisfies Loader<
  ObjectRowTable | ArrayRowTable | ColumnarTable | ArrowTable,
  TableBatch | ColumnarTableBatch | ArrowTableBatch,
  CSVLoaderOptions
>;
