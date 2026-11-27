// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {PCDLoaderDefinition} from './pcd-loader-definition';

export type {PCDLoaderOptions} from './pcd-loader-definition';

/**
 * Preloads the parser-bearing PCD loader implementation.
 */
async function preload() {
  const {PCDLoaderWithParser} = await import('@loaders.gl/pointclouds/pcd/parser');
  return PCDLoaderWithParser;
}

/** Starts the browser module worker for PCD decoding. */
function loadPCDWorker(): Worker | null {
  if (typeof Worker !== 'undefined') {
    return new Worker(new URL('../pcd-worker.js', import.meta.url), {type: 'module'});
  }
  return null;
}

/** Metadata-only PCD loader with an on-demand browser worker. */
export const PCDLoader = {
  ...PCDLoaderDefinition,
  loadWorker: loadPCDWorker,
  preload
} as const;
