// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {
  ArrowTable,
  ArrowTableBatch,
  ObjectRowTable,
  ObjectRowTableBatch
} from '@loaders.gl/schema';

import {LanceFormat} from './lance-format';
import type {LanceFlatPrimitiveType} from './lance-decoder';

/** Options for the read-only Lance loader. */
export type LanceLoaderOptions = {
  lance?: {
    /** Columns to project into the returned table. */
    columns?: string[];
    /** Maximum number of rows to return. */
    limit?: number;
    /** Output representation for decoded tables. */
    shape?: 'arrow-table' | 'object-row-table';
    /** Primitive type for each physical column in the MVP reader. */
    columnTypes?: LanceFlatPrimitiveType[];
    /** Optional output names for physical columns in the MVP reader. */
    columnNames?: string[];
  };
};

/** Shared Lance loader options. */
export const LANCE_LOADER_OPTIONS = {
  lance: {
    columns: undefined,
    limit: undefined,
    shape: 'arrow-table',
    columnTypes: undefined,
    columnNames: undefined
  }
} as const;

/** Preloads the parser-bearing Lance loader implementation. */
async function preloadLanceLoader() {
  const {LanceLoaderWithParser} = await import('@loaders.gl/lance/lance-loader');
  return LanceLoaderWithParser;
}

/** Metadata-only read-only Lance table loader. */
export const LanceLoader = {
  ...LanceFormat,
  dataType: null as unknown as ObjectRowTable | ArrowTable,
  batchType: null as unknown as ObjectRowTableBatch | ArrowTableBatch,
  id: 'lance',
  module: 'lance',
  version: 'latest',
  options: LANCE_LOADER_OPTIONS,
  preload: preloadLanceLoader
} as const satisfies Loader<
  ObjectRowTable | ArrowTable,
  ObjectRowTableBatch | ArrowTableBatch,
  LanceLoaderOptions
>;
