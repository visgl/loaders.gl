// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ParquetLoaderDefinition} from './parquet-loader-definition';

export type {ParquetLoaderOptions} from './parquet-loader-definition';

/** Preloads the parser without pulling the full format barrel into the chunk graph. */
async function preloadParquetLoader() {
  const {ParquetLoaderWithParser} = await import('../parquet-loader.js');
  return ParquetLoaderWithParser;
}

/** Starts the browser module worker for Parquet decoding. */
function loadParquetWorker(): Worker | null {
  if (typeof Worker !== 'undefined') {
    return new Worker(new URL('../parquet-worker.js', import.meta.url), {type: 'module'});
  }
  return null;
}

/** Metadata-only Parquet loader with an on-demand browser worker. */
export const ParquetLoader = {
  ...ParquetLoaderDefinition,
  loadWorker: loadParquetWorker,
  preload: preloadParquetLoader
} as const;
