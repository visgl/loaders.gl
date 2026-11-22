// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// PLY Loader
import {PLYLoaderDefinition} from './ply-loader-definition';

export type {PLYLoaderOptions} from './ply-loader-definition';

/**
 * Preloads the parser-bearing PLY loader implementation.
 */
async function preload() {
  const {PLYLoaderWithParser} = await import('@loaders.gl/pointclouds/ply');
  return PLYLoaderWithParser;
}

/** Starts the browser module worker for PLY decoding. */
function loadPLYWorker(): Worker | null {
  if (typeof Worker !== 'undefined') {
    const moduleUrl = import.meta.url;
    // Native browser workers cannot use the page's import map.
    if (
      /^https?:/.test(moduleUrl) &&
      new URL(moduleUrl).pathname.endsWith('/dist/ply/ply-loader-types.js')
    ) {
      const workerUrl = new URL('../ply-worker.js', moduleUrl);
      return new Worker(workerUrl, {type: 'module'});
    }
    return new Worker(new URL('./workers/ply-worker.js', import.meta.url), {type: 'module'});
  }
  return null;
}

/** Metadata-only PLY loader with an on-demand browser worker. */
export const PLYLoader = {
  ...PLYLoaderDefinition,
  loadWorker: loadPLYWorker,
  preload
} as const;
