// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CSVLoaderDefinition} from './csv-loader-definition';
import type {CSVTableSource, CSVSourceOptions} from './csv-source';
import type {CoreAPI} from '@loaders.gl/core/loader-utils';

export type {CSVLoaderOptions} from './csv-loader-options';

/** Preloads the parser-bearing CSV loader implementation. */
async function preloadCSVLoader() {
  const {CSVLoaderWithParser} = await import('@loaders.gl/tables/csv/parser');
  return CSVLoaderWithParser;
}

/** Starts the browser module worker for CSV decoding. */
function loadCSVWorker(): Worker | null {
  if (typeof Worker !== 'undefined') {
    const moduleUrl = import.meta.url;
    // Native browser workers cannot use the page's import map.
    if (
      /^https?:/.test(moduleUrl) &&
      new URL(moduleUrl).pathname.endsWith('/dist/csv/csv-loader-types.js')
    ) {
      const workerUrl = new URL('../csv-worker.js', moduleUrl);
      return new Worker(workerUrl, {type: 'module'});
    }
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
