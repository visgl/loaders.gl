// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {
  ObjectRowTable,
  ArrayRowTable,
  ArrowTable,
  ArrowTableBatch,
  TableBatch
} from '@loaders.gl/schema';
import {NDJSONFormat} from './json-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

type NDJSONShape = 'array-row-table' | 'object-row-table' | 'arrow-table';

/** Options for parsing newline-delimited JSON data. */
export type NDJSONLoaderOptions = LoaderOptions & {
  ndjson?: {
    /** Selects row-table output or Apache Arrow output. */
    shape?: NDJSONShape;
  };
  json?: {
    /** Deprecated alias for `ndjson.shape`. */
    shape?: NDJSONShape;
  };
};

/** Preloads the parser-bearing NDJSON loader implementation. */
async function preload() {
  const {NDJSONLoaderWithParser} = await import('./ndjson-loader-with-parser');
  return NDJSONLoaderWithParser;
}

/** Metadata-only loader for newline-delimited JSON row and Arrow tables. */
export const NDJSONLoader = {
  dataType: null as unknown as ArrayRowTable | ObjectRowTable | ArrowTable,
  batchType: null as unknown as TableBatch | ArrowTableBatch,

  ...NDJSONFormat,
  version: VERSION,
  options: {
    ndjson: {
      shape: 'object-row-table'
    }
  },
  preload
} as const satisfies Loader<
  ObjectRowTable | ArrayRowTable | ArrowTable,
  TableBatch | ArrowTableBatch,
  NDJSONLoaderOptions
>;
