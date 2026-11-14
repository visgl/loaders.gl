// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {Table, RecordBatch} from 'apache-arrow';

import {LanceFormat} from './lance-format';
import type {LanceFlatPrimitiveType} from './lance-decoder';

/** Options for the read-only Lance loader. */
export type LanceLoaderOptions = LoaderOptions & {
  lance?: {
    /** Return native Arrow data. */
    shape?: 'arrow';
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
    shape: 'arrow',
    columns: undefined,
    limit: undefined,
    columnTypes: undefined,
    columnNames: undefined
  }
} as const;

/** Preloads the parser-bearing Lance loader implementation. */
async function preloadLanceLoader() {
  const {LanceLoaderWithParser} = await import('@loaders.gl/tables/lance-loader');
  return LanceLoaderWithParser;
}

/** Metadata-only read-only Lance table loader. */
export const LanceLoader = {
  /** Matches input for source selection. */
  testURL: (url: string): boolean => /(?:\.lance|\.lance\/)(?:$|[?#/])/i.test(url),
  fromUrl: true,
  fromBlob: true,
  type: 'lance',
  ...LanceFormat,
  dataType: null as unknown as Table,
  batchType: null as unknown as RecordBatch,
  id: 'lance',
  module: 'tables',
  version: 'latest',
  defaultShape: 'arrow',
  supportsNativeArrow: true,
  options: LANCE_LOADER_OPTIONS,
  preload: preloadLanceLoader
} as const satisfies Loader<Table, RecordBatch, LanceLoaderOptions>;
