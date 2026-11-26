// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {PCDLoaderDefinition} from './pcd-loader-definition';

export type {PCDLoaderOptions} from './pcd-loader-definition';

/**
 * Preloads the parser-bearing PCD loader implementation.
 */
async function preload() {
  const {PCDLoaderWithParser} = await import('../pcd-loader.js');
  return PCDLoaderWithParser;
}

/** Starts the browser module worker for PCD decoding. */
function loadPCDWorker(): Worker | null {
  if (typeof Worker !== 'undefined') {
    const moduleUrl = import.meta.url;
    // Native browser workers cannot use the page's import map.
    if (
      /^https?:/.test(moduleUrl) &&
      new URL(moduleUrl).pathname.endsWith('/dist/pcd/pcd-loader-types.js')
    ) {
      const workerUrl = new URL('../pcd-worker.js', moduleUrl);
      return new Worker(workerUrl, {type: 'module'});
    }
    return new Worker(new URL('./workers/pcd-worker.js', import.meta.url), {type: 'module'});
  }
  return null;
}

/** Metadata-only PCD loader with an on-demand browser worker. */
export const PCDLoader = {
  ...PCDLoaderDefinition,
  loadWorker: loadPCDWorker,
  preload
} as const;
