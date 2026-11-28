// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ArrowTable, RecordBatch as ArrowTableBatch} from 'apache-arrow';
import type {Schema, Table, TableBatch} from '@loaders.gl/core/schema';
import type {Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import type * as arrow from 'apache-arrow';
import {JSON_WORKER_URL} from './json-worker-url';
import {JSONFormat} from './json-format';
import type {JSONBatch, MetadataBatch} from './json-loader-types';
import type {ArrowConversionOptions} from './lib/parsers/convert-row-table-to-arrow';

import type {TableSchemaInference} from '../lib/table-schema-inference';
export type {TableSchemaInference} from '../lib/table-schema-inference';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Options for parsing JSON payloads that must produce loaders.gl table output.
 */
export type JSONTableLoaderOptions = LoaderOptions & {
  /** JSON table parser options. */
  json?: {
    /** Requested table output shape. */
    shape?: 'arrow' | 'object-row-table' | 'array-row-table';
    /** Records used to infer types when no schema is supplied. Defaults to first-batch for streams. */
    schemaInference?: TableSchemaInference;
    /** JSON paths identifying arrays that can be streamed as row batches. */
    jsonpaths?: string[];
    /** Optional schema used when converting JSON rows to Arrow. */
    schema?: Schema | arrow.Schema;
    /** Optional recovery policy used when converting JSON rows to Arrow. */
    arrowConversion?: ArrowConversionOptions;
  };
};

const sourceMetadata = {
  type: 'json-table-source',
  fromUrl: true,
  fromBlob: true,
  defaultOptions: {},
  testURL: (url: string): boolean => /\.json(?:$|[?#])/i.test(url)
} as const;

/**
 * Metadata-only loader for tabular JSON documents and streamed JSON row arrays.
 *
 * `JSONTableLoader` always resolves to loaders.gl table output. Use `JSONLoader`
 * when the parsed payload may be an arbitrary JSON document.
 */
export const JSONTableLoaderDefinition = {
  fetchBeforePreload: true,
  ...sourceMetadata,
  defaultShape: 'arrow',
  supportsNativeArrow: true,
  dataType: null as unknown as Table | ArrowTable,
  batchType: null as unknown as TableBatch | ArrowTableBatch | MetadataBatch | JSONBatch,

  ...JSONFormat,
  name: 'JSON Table',
  id: 'json-table',
  version: VERSION,
  worker: JSON_WORKER_URL,
  workerFile: 'json-worker.js',
  workerNode: 'json-worker-node.cjs',
  workerSourceNode: 'json/workers/json-worker.ts',
  workerInBatches: true,
  options: {
    json: {
      shape: 'arrow',
      jsonpaths: [],
      schema: undefined,
      arrowConversion: undefined
    }
  }
} as const satisfies Loader<
  Table | ArrowTable,
  TableBatch | ArrowTableBatch | MetadataBatch | JSONBatch,
  JSONTableLoaderOptions
>;
