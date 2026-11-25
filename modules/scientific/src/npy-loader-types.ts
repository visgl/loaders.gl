// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NPYLoaderDefinition} from './npy-loader-definition';

export type {NPYLoaderOptions} from './npy-loader-definition';

/** Preloads the parser-bearing NPY loader implementation. */
async function preload() {
  const {NPYLoaderWithParser} = await import('@loaders.gl/scientific/npy/bundled');
  return NPYLoaderWithParser;
}

/** Starts the browser module worker for NPY decoding. */
function loadNPYWorker(): Worker | null {
  if (typeof Worker !== 'undefined') {
    const moduleUrl = import.meta.url;
    // Native browser workers cannot use the page's import map.
    if (
      /^https?:/.test(moduleUrl) &&
      new URL(moduleUrl).pathname.endsWith('/dist/npy-loader-types.js')
    ) {
      const workerUrl = new URL('./npy-worker.js', moduleUrl);
      return new Worker(workerUrl, {type: 'module'});
    }
    return new Worker(new URL('./workers/npy-worker.js', import.meta.url), {type: 'module'});
  }
  return null;
}

/** Metadata-only NPY loader with an on-demand browser worker. */
export const NPYLoader = {
  ...NPYLoaderDefinition,
  loadWorker: loadNPYWorker,
  preload
} as const;
