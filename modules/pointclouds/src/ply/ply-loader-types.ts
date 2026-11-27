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
  const {PLYLoaderWithParser} = await import('@loaders.gl/pointclouds/ply/parser');
  return PLYLoaderWithParser;
}

/** Starts the browser module worker for PLY decoding. */
function loadPLYWorker(): Worker | null {
  if (typeof Worker !== 'undefined') {
    return new Worker(new URL('../ply-worker.js', import.meta.url), {type: 'module'});
  }
  return null;
}

/** Metadata-only PLY loader with an on-demand browser worker. */
export const PLYLoader = {
  ...PLYLoaderDefinition,
  loadWorker: loadPLYWorker,
  preload
} as const;
