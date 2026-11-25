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
    const moduleUrl = import.meta.url;
    // Native workers cannot resolve the page's import map. The distributed
    // standalone asset handles that case while app bundles use the ESM entry.
    // Bundlers may replace import.meta.url with a build-machine file URL.
    if (
      /^https?:/.test(moduleUrl) &&
      new URL(moduleUrl).pathname.endsWith('/dist/parquet/parquet-loader-types.js')
    ) {
      const workerUrl = new URL('../parquet-worker.js', moduleUrl);
      return new Worker(workerUrl, {type: 'module'});
    }
    return new Worker(new URL('./workers/parquet-worker.js', import.meta.url), {type: 'module'});
  }
  return null;
}

/** Metadata-only Parquet loader with an on-demand browser worker. */
export const ParquetLoader = {
  ...ParquetLoaderDefinition,
  loadWorker: loadParquetWorker,
  preload: preloadParquetLoader
} as const;
