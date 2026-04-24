// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, ArrowTableBatch, Batch, Table, TableBatch} from '@loaders.gl/schema';
import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Metadata batch emitted while streaming JSON. */
export type MetadataBatch = Batch & {
  shape: 'metadata';
};

/** Partial or final container object emitted while streaming JSON. */
export type JSONBatch = Batch & {
  shape: 'json';
  /** JSON data */
  container: any;
};

/** Options for parsing JSON documents and tabular selections. */
export type JSONLoaderOptions = LoaderOptions & {
  json?: {
    /** Selects row-table output or Apache Arrow output for tabular JSON. */
    shape?: 'object-row-table' | 'array-row-table' | 'arrow-table';
    /** Enables table extraction from non-streaming JSON. */
    table?: boolean;
    /** Selects one or more JSON arrays to stream. */
    jsonpaths?: string[];
  };
};

/** Preloads the parser-bearing JSON loader implementation. */
async function preload() {
  const {JSONLoaderWithParser} = await import('./json-loader-with-parser');
  return JSONLoaderWithParser;
}

/** Metadata-only loader for JSON documents, including tabular JSON and streaming table extraction. */
export const JSONLoader = {
  dataType: null as unknown as Table | ArrowTable,
  batchType: null as unknown as TableBatch | ArrowTableBatch | MetadataBatch | JSONBatch,

  name: 'JSON',
  id: 'json',
  module: 'json',
  version: VERSION,
  extensions: ['json', 'geojson'],
  mimeTypes: ['application/json'],
  category: 'table',
  text: true,
  options: {
    json: {
      shape: undefined,
      table: false,
      jsonpaths: []
      // batchSize: 'auto'
    }
  },
  preload
} as const satisfies Loader<
  Table | ArrowTable,
  TableBatch | ArrowTableBatch | MetadataBatch | JSONBatch,
  JSONLoaderOptions
>;
