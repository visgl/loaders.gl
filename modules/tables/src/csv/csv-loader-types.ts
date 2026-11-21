// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CSVLoaderDefinition} from './csv-loader-definition';
import type {CSVTableSource, CSVSourceOptions} from './csv-source';
import type {CoreAPI} from '@loaders.gl/core/loader-utils';

export type {CSVLoaderOptions} from './csv-loader-definition';

/** Preloads the parser-bearing CSV loader implementation. */
async function preloadCSVLoader() {
  const {CSVLoaderWithParser} = await import('@loaders.gl/tables/csv');
  return CSVLoaderWithParser;
}

/** Starts the browser module worker for CSV decoding. */
function loadCSVWorker(): Worker | null {
  if (typeof Worker !== 'undefined') {
    return new Worker(new URL('../workers/csv-worker.js', import.meta.url), {type: 'module'});
  }
  return null;
}

/** Metadata-only CSV loader with an on-demand browser worker. */
export const CSVLoader = {
  ...CSVLoaderDefinition,
  loadWorker: loadCSVWorker,
  preload: preloadCSVLoader,
  createDataSourceSync(
    _data: string | Blob,
    _options: CSVSourceOptions,
    _coreApi?: CoreAPI
  ): CSVTableSource {
    throw new Error('Call preload(CSVLoader) before creating a source synchronously.');
  }
} as const;
