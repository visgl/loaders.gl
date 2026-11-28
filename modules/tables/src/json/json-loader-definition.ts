// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RecordBatch} from 'apache-arrow';
import type {Batch, TableBatch} from '@loaders.gl/core/schema';
import type {Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import {JSON_WORKER_URL} from './json-worker-url';
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
    /** Explicit row output. Batched table mode defaults to Arrow when shape is omitted. */
    shape?: 'object-row-table' | 'array-row-table';
    /** Whether non-streaming JSON should be interpreted as table rows. */
    table?: boolean;
    /** JSON paths identifying arrays that can be streamed as row batches. */
    jsonpaths?: string[];
  };
};

/** Metadata-only loader for JSON documents, including tabular JSON and streaming table extraction. */
export const JSONLoaderDefinition = {
  fetchBeforePreload: true,
  dataType: null as unknown,
  batchType: null as unknown as TableBatch | RecordBatch | MetadataBatch | JSONBatch,

  ...JSONFormat,
  version: VERSION,
  worker: JSON_WORKER_URL,
  workerFile: 'json-worker.js',
  workerNode: 'json-worker-node.cjs',
  workerSourceNode: 'json/workers/json-worker.ts',
  workerInBatches: true,
  options: {
    json: {
      shape: undefined,
      table: false,
      jsonpaths: []
      // batchSize: 'auto'
    }
  }
} as const satisfies Loader<
  unknown,
  TableBatch | RecordBatch | MetadataBatch | JSONBatch,
  JSONLoaderOptions
>;
