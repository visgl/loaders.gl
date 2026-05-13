// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Batch, TableBatch} from '@loaders.gl/schema';
import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import {JSONFormat} from './json-format';

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
  /** JSON data. */
  container: any;
};

/** Options for parsing JSON documents and tabular selections. */
export type JSONLoaderOptions = LoaderOptions & {
  /** JSON parser options. */
  json?: {
    /** Selects the streaming JSON parser backend. */
    backend?: 'clarinet' | 'fast';
    /** Requested row-table output shape. Omitting shape preserves the default JSON result. */
    shape?: 'object-row-table' | 'array-row-table';
    /** Whether non-streaming JSON should be interpreted as table rows. */
    table?: boolean;
    /** JSON paths identifying arrays that can be streamed as row batches. */
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
  dataType: null as unknown,
  batchType: null as unknown as TableBatch | MetadataBatch | JSONBatch,

  ...JSONFormat,
  version: VERSION,
  options: {
    json: {
      backend: 'clarinet',
      shape: undefined,
      table: false,
      jsonpaths: []
      // batchSize: 'auto'
    }
  },
  preload
} as const satisfies Loader<unknown, TableBatch | MetadataBatch | JSONBatch, JSONLoaderOptions>;
