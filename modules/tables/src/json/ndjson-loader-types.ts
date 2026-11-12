// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NDJSONTableSource, NDJSONSourceOptions} from './ndjson-source';
import type {CoreAPI, Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {
  ObjectRowTable,
  ArrayRowTable,
  ArrowTable,
  ArrowTableBatch,
  Schema,
  TableBatch
} from '@loaders.gl/core/schema';
import type * as arrow from 'apache-arrow';
import {JSON_WORKER_URL} from './json-worker-url';
import {NDJSONFormat} from './json-format';
import type {ArrowConversionOptions} from './lib/parsers/convert-row-table-to-arrow';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type NDJSONShape = 'arrow' | 'arrow-table' | 'array-row-table' | 'object-row-table';

/** Options for parsing newline-delimited JSON data. */
export type NDJSONLoaderOptions = LoaderOptions & {
  /** NDJSON parser options. */
  ndjson?: {
    /** Requested output shape. */
    shape?: NDJSONShape;
    /** Optional schema used for Arrow conversion and NDJSON table sources. */
    schema?: Schema | arrow.Schema;
    /** Optional recovery policy used when converting NDJSON rows to Arrow. */
    arrowConversion?: ArrowConversionOptions;
  };
  /** Deprecated JSON parser alias used only for NDJSON shape selection. */
  json?: {
    /** Deprecated alias for wrapped outputs; use `ndjson.shape` for native Arrow. */
    shape?: Exclude<NDJSONShape, 'arrow'>;
  };
};

/** Preloads the parser-bearing NDJSON loader implementation. */
async function preload() {
  const {NDJSONLoaderWithParser} = await import('@loaders.gl/tables/ndjson-loader');
  return NDJSONLoaderWithParser;
}

const sourceMetadata = {
  type: 'ndjson-source',
  fromUrl: true,
  fromBlob: true,
  defaultOptions: {},
  testURL: (url: string): boolean => /\.(?:ndjson|jsonl)(?:$|[?#])/i.test(url)
} as const;

/** Metadata-only loader for newline-delimited JSON row and Arrow tables. */
export const NDJSONLoader = {
  ...sourceMetadata,
  defaultShape: 'arrow',
  dataType: null as unknown as ArrayRowTable | ObjectRowTable | ArrowTable,
  batchType: null as unknown as TableBatch | ArrowTableBatch,

  ...NDJSONFormat,
  version: VERSION,
  worker: JSON_WORKER_URL,
  workerFile: 'json-worker.js',
  workerNode: 'json-worker-node.cjs',
  workerSourceNode: 'json/workers/json-worker.ts',
  workerInBatches: true,
  options: {
    ndjson: {
      shape: 'arrow-table',
      schema: undefined,
      arrowConversion: undefined
    }
  },
  preload,
  createDataSourceSync(
    _data: string | Blob,
    _options: NDJSONSourceOptions,
    _coreApi?: CoreAPI
  ): NDJSONTableSource {
    throw new Error('Call preload(NDJSONLoader) before creating a source synchronously.');
  }
} as const satisfies Loader<
  ObjectRowTable | ArrayRowTable | ArrowTable,
  TableBatch | ArrowTableBatch,
  NDJSONLoaderOptions,
  NDJSONTableSource
>;
