// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import {convertTable, convertBatches} from '@loaders.gl/schema-utils';

import type {CSVLoaderOptions} from './csv-loader';
import {CSVLoader} from './csv-loader';

export type CSVArrowLoaderOptions = LoaderOptions & {
  csv?: Omit<CSVLoaderOptions['csv'], 'shape'>;
};

export const CSVArrowLoader = {
  ...CSVLoader,

  dataType: null as unknown as ArrowTable,
  batchType: null as unknown as ArrowTableBatch,

  parse: async (arrayBuffer: ArrayBuffer, options?: CSVLoaderOptions) =>
    parseCSVToArrow(new TextDecoder().decode(arrayBuffer), options),
  parseText: (text: string, options?: CSVLoaderOptions) => parseCSVToArrow(text, options),
  parseInBatches: parseCSVToArrowBatches
} as const satisfies LoaderWithParser<ArrowTable, ArrowTableBatch, CSVArrowLoaderOptions>;

async function parseCSVToArrow(csvText: string, options?: CSVLoaderOptions): Promise<ArrowTable> {
  // Apps can call the parse method directly, we so apply default options here
  // const csvOptions = {...CSVArrowLoader.options.csv, ...options?.csv};
  const table = await CSVLoader.parseText(csvText, options);
  return convertTable(table, 'arrow-table');
}

function parseCSVToArrowBatches(
  asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  options?: CSVArrowLoaderOptions
): AsyncIterable<ArrowTableBatch> {
  const tableIterator = CSVLoader.parseInBatches(asyncIterator, options);
  return convertBatches(tableIterator, 'arrow-table');
}
