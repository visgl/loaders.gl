// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';

import type {CSVTypedArrowLoaderOptions} from './csv-typed-arrow-loader';
import {CSVTypedArrowLoader} from './csv-typed-arrow-loader';

/** Options for parsing CSV input into Apache Arrow tables. */
export type CSVArrowLoaderOptions = CSVTypedArrowLoaderOptions;

/**
 * CSV loader that returns Apache Arrow tables.
 *
 * The default `csv.dynamicTyping: false` path emits Arrow Utf8 columns and uses
 * the byte-oriented parser when the supplied options are supported. Set
 * `csv.dynamicTyping: true` to opt into typed Arrow columns.
 */
export const CSVArrowLoader = {
  ...CSVTypedArrowLoader,

  options: {
    ...CSVTypedArrowLoader.options,
    csv: {
      ...CSVTypedArrowLoader.options.csv,
      dynamicTyping: false,
      skipEmptyLines: false
    }
  },

  parse: async (arrayBuffer: ArrayBuffer, options?: CSVArrowLoaderOptions) =>
    CSVTypedArrowLoader.parse(arrayBuffer, createCSVArrowLoaderOptions(options)),

  parseText: (text: string, options?: CSVArrowLoaderOptions) =>
    CSVTypedArrowLoader.parseText(text, createCSVArrowLoaderOptions(options)),

  parseInBatches: (
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: CSVArrowLoaderOptions
  ) => CSVTypedArrowLoader.parseInBatches(asyncIterator, createCSVArrowLoaderOptions(options))
} as const satisfies LoaderWithParser<ArrowTable, ArrowTableBatch, CSVArrowLoaderOptions>;

/** Applies CSVArrowLoader defaults before delegating to internal Arrow CSV parsing helpers. */
function createCSVArrowLoaderOptions(options?: CSVArrowLoaderOptions): CSVArrowLoaderOptions {
  const skipEmptyLinesIsExplicit =
    (options?.csv && Object.prototype.hasOwnProperty.call(options.csv, 'skipEmptyLinesIsExplicit')
      ? Boolean(options.csv.skipEmptyLinesIsExplicit)
      : undefined) ?? Boolean(options?.csv && options.csv.skipEmptyLines === true);
  return {
    ...options,
    csv: {
      ...CSVArrowLoader.options.csv,
      ...options?.csv,
      skipEmptyLinesIsExplicit
    }
  };
}
