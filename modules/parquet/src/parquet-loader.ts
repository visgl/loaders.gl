// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {
  ObjectRowTable,
  ObjectRowTableBatch,
  ArrowTable,
  ArrowTableBatch
} from '@loaders.gl/schema';

import {ParquetFormat} from './parquet-format';
import {
  PARQUET_LOADER_DEFAULT_OPTIONS,
  type ParquetLoaderOptions as SharedParquetLoaderOptions
} from './parquet-loader-options';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Module-relative worker asset for browser ESM and Node.js CommonJS distributions. */
const PARQUET_WORKER_URL = import.meta.url
  ? new URL(getParquetWorkerFile(), import.meta.url).toString()
  : typeof __dirname === 'string'
    ? `${__dirname}/parquet-worker-node.cjs`
    : true;

/** Selects the worker bundle for the current JavaScript runtime. */
function getParquetWorkerFile(): string {
  const isNode = Boolean(
    (globalThis as {process?: {versions?: {node?: string}}}).process?.versions?.node
  );
  return isNode ? './parquet-worker-node.cjs' : './parquet-worker.js';
}

/** Options for the parquet loader */
export type ParquetLoaderOptions = SharedParquetLoaderOptions;

/** Preloads the parser-bearing Parquet loader implementation selected by `parquet.backend`. */
async function preloadParquetLoader(_url: string, options?: LoaderOptions) {
  const parquetOptions = options as ParquetLoaderOptions | undefined;
  switch (getParquetBackend(parquetOptions)) {
    case 'wasm': {
      const {ParquetWASMLoaderWithParser} = await import('./parquet-wasm-loader-with-parser');
      return ParquetWASMLoaderWithParser;
    }

    case 'typescript': {
      if (parquetOptions?.parquet?.shape === 'arrow-table') {
        throw new Error('ParquetLoader: backend "typescript" does not support shape "arrow-table"');
      }
      const {ParquetLoaderWithParser} = await import('./parquet-loader-with-parser');
      return ParquetLoaderWithParser;
    }

    default:
      throw new Error(`ParquetLoader: unsupported backend "${parquetOptions?.parquet?.backend}"`);
  }
}

/** Metadata-only Parquet table loader supporting object-row and Arrow table output. */
export const ParquetLoader = {
  ...ParquetFormat,

  dataType: null as unknown as ObjectRowTable | ArrowTable,
  batchType: null as unknown as ObjectRowTableBatch | ArrowTableBatch,

  id: 'parquet',
  module: 'parquet',
  version: VERSION,
  worker: PARQUET_WORKER_URL,
  options: {
    parquet: {
      ...PARQUET_LOADER_DEFAULT_OPTIONS
    }
  },
  preload: preloadParquetLoader
} as const satisfies Loader<
  ObjectRowTable | ArrowTable,
  ObjectRowTableBatch | ArrowTableBatch,
  ParquetLoaderOptions
>;

function getParquetBackend(options?: ParquetLoaderOptions): 'wasm' | 'typescript' {
  if (options?.parquet?.backend) {
    return options.parquet.backend;
  }
  if (options?.parquet?.implementation === 'js') {
    return 'typescript';
  }
  return ParquetLoader.options.parquet.backend;
}
