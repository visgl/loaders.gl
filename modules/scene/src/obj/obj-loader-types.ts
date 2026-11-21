// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OBJLoaderDefinition} from './obj-loader-definition';

export type {OBJLoaderOptions, OBJMeshBatch, OBJParsedBatch} from './obj-loader-definition';

/**
 * Preloads the parser-bearing OBJ loader implementation.
 */
async function preload() {
  const {OBJLoaderWithParser} = await import('@loaders.gl/scene/obj');
  return {...OBJLoaderWithParser, loadWorker: loadOBJWorker};
}

/** Starts the browser module worker for OBJ decoding. */
function loadOBJWorker(): Worker | null {
  if (typeof Worker !== 'undefined') {
    return new Worker(new URL('./workers/obj-worker.js', import.meta.url), {type: 'module'});
  }
  return null;
}

/** Metadata-only OBJ loader with an on-demand browser worker. */
export const OBJLoader = {
  ...OBJLoaderDefinition,
  loadWorker: loadOBJWorker,
  preload
} as const;
