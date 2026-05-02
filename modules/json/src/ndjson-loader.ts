// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {
  ObjectRowTable,
  ArrayRowTable,
  ArrowTable,
  ArrowTableBatch,
  Schema,
  TableBatch
} from '@loaders.gl/schema';
import type * as arrow from 'apache-arrow';
import {NDJSONFormat} from './json-format';
import type {ArrowConversionOptions} from './lib/parsers/convert-row-table-to-arrow';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type NDJSONShape = 'array-row-table' | 'object-row-table' | 'arrow-table';

/** Options for parsing newline-delimited JSON data. */
export type NDJSONLoaderOptions = LoaderOptions & {
  /** NDJSON parser options. */
  ndjson?: {
    /** Requested output shape. */
    shape?: NDJSONShape;
    /** Optional schema used when converting NDJSON rows to Arrow. */
    schema?: Schema | arrow.Schema;
    /** Optional recovery policy used when converting NDJSON rows to Arrow. */
    arrowConversion?: ArrowConversionOptions;
  };
  /** Deprecated JSON parser alias used only for NDJSON shape selection. */
  json?: {
    /** Deprecated alias for `ndjson.shape`; `ndjson.shape` takes precedence. */
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
      shape: 'object-row-table',
      schema: undefined,
      arrowConversion: undefined
    }
  },
  preload
} as const satisfies Loader<
  ObjectRowTable | ArrayRowTable | ArrowTable,
  TableBatch | ArrowTableBatch,
  NDJSONLoaderOptions
>;
