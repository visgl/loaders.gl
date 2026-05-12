// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, ArrowTableBatch, Schema, Table, TableBatch} from '@loaders.gl/schema';
import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type * as arrow from 'apache-arrow';
import {JSONFormat} from './json-format';
import type {JSONBatch, MetadataBatch} from './json-loader';
import type {ArrowConversionOptions} from './lib/parsers/convert-row-table-to-arrow';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Options for parsing JSON payloads that must produce loaders.gl table output.
 */
export type JSONTableLoaderOptions = LoaderOptions & {
  /** JSON table parser options. */
  json?: {
    /** Selects the streaming JSON parser backend. */
    backend?: 'clarinet' | 'fast';
    /** Requested table output shape. */
    shape?: 'object-row-table' | 'array-row-table' | 'arrow-table';
    /** JSON paths identifying arrays that can be streamed as row batches. */
    jsonpaths?: string[];
    /** Optional schema used when converting JSON rows to Arrow. */
    schema?: Schema | arrow.Schema;
    /** Optional recovery policy used when converting JSON rows to Arrow. */
    arrowConversion?: ArrowConversionOptions;
  };
};

/**
 * Preloads the parser-bearing JSON table loader implementation.
 *
 * @returns The parser-bearing `JSONTableLoaderWithParser` implementation.
 */
async function preload() {
  const {JSONTableLoaderWithParser} = await import('./json-table-loader-with-parser');
  return JSONTableLoaderWithParser;
}

/**
 * Metadata-only loader for tabular JSON documents and streamed JSON row arrays.
 *
 * `JSONTableLoader` always resolves to loaders.gl table output. Use `JSONLoader`
 * when the parsed payload may be an arbitrary JSON document.
 */
export const JSONTableLoader = {
  dataType: null as unknown as Table | ArrowTable,
  batchType: null as unknown as TableBatch | ArrowTableBatch | MetadataBatch | JSONBatch,

  ...JSONFormat,
  name: 'JSON Table',
  id: 'json-table',
  version: VERSION,
  options: {
    json: {
      backend: 'clarinet',
      shape: 'object-row-table',
      jsonpaths: [],
      schema: undefined,
      arrowConversion: undefined
    }
  },
  preload
} as const satisfies Loader<
  Table | ArrowTable,
  TableBatch | ArrowTableBatch | MetadataBatch | JSONBatch,
  JSONTableLoaderOptions
>;
