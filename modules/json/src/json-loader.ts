// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ArrowTable,
  ArrowTableBatch,
  Batch,
  Schema,
  Table,
  TableBatch
} from '@loaders.gl/schema';
import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type * as arrow from 'apache-arrow';
import {JSONFormat} from './json-format';
import type {ArrowConversionOptions} from './lib/parsers/convert-row-table-to-arrow';

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
    /** Requested output shape. Omitting shape preserves the default JSON result. */
    shape?: 'object-row-table' | 'array-row-table' | 'arrow-table';
    /** Whether non-streaming JSON should be interpreted as table rows. */
    table?: boolean;
    /** JSON paths identifying arrays that can be streamed as row batches. */
    jsonpaths?: string[];
    /** Optional schema used when converting JSON rows to Arrow. */
    schema?: Schema | arrow.Schema;
    /** Optional recovery policy used when converting JSON rows to Arrow. */
    arrowConversion?: ArrowConversionOptions;
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

  ...JSONFormat,
  version: VERSION,
  options: {
    json: {
      shape: undefined,
      table: false,
      jsonpaths: [],
      schema: undefined,
      arrowConversion: undefined
      // batchSize: 'auto'
    }
  },
  preload
} as const satisfies Loader<
  Table | ArrowTable,
  TableBatch | ArrowTableBatch | MetadataBatch | JSONBatch,
  JSONLoaderOptions
>;
