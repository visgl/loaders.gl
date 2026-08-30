// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';

import {LanceFormat} from './lance-format';
import type {LanceFlatPrimitiveType} from './lance-decoder';

/** Options for the read-only Lance loader. */
export type LanceLoaderOptions = LoaderOptions & {
  lance?: {
    /** Columns to project into the returned table. (Physical projection is not yet part of `_scan`.) */
    columns?: string[];
    /** @deprecated Use `_scan.limit` instead. */
    limit?: number;
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
  dataType: null as unknown as ArrowTable,
  batchType: null as unknown as ArrowTableBatch,
  id: 'lance',
  module: 'lance',
  version: 'latest',
  options: LANCE_LOADER_OPTIONS,
  preload: preloadLanceLoader
} as const satisfies Loader<ArrowTable, ArrowTableBatch, LanceLoaderOptions>;
