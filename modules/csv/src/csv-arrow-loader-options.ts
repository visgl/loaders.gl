// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/loader-utils';
import type {CSVLoaderOptions} from './csv-loader-options';
import {CSV_LOADER_OPTIONS} from './csv-loader-options';

export type CSVArrowOptions = Omit<NonNullable<CSVLoaderOptions['csv']>, 'shape'> & {
  /** @internal Whether the caller explicitly supplied `skipEmptyLines`. */
  skipEmptyLinesIsExplicit?: boolean;
};

export type CSVArrowLoaderOptions = LoaderOptions & {
  csv?: CSVArrowOptions;
};

export const CSV_ARROW_DEFAULT_OPTIONS: CSVArrowOptions = {
  optimizeMemoryUsage: CSV_LOADER_OPTIONS.csv.optimizeMemoryUsage,
  header: CSV_LOADER_OPTIONS.csv.header,
  columnPrefix: CSV_LOADER_OPTIONS.csv.columnPrefix,
  quoteChar: CSV_LOADER_OPTIONS.csv.quoteChar,
  escapeChar: CSV_LOADER_OPTIONS.csv.escapeChar,
  dynamicTyping: false,
  comments: CSV_LOADER_OPTIONS.csv.comments,
  skipEmptyLines: false,
  detectGeometryColumns: CSV_LOADER_OPTIONS.csv.detectGeometryColumns,
  delimitersToGuess: CSV_LOADER_OPTIONS.csv.delimitersToGuess
};

export const CSV_ARROW_LOADER_OPTIONS = {
  ...CSV_LOADER_OPTIONS,
  csv: CSV_ARROW_DEFAULT_OPTIONS
} as const satisfies CSVArrowLoaderOptions;
