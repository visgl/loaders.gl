// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {FlatGeobufLoaderDefinition} from './flatgeobuf-loader-definition';

export type {FlatGeobufLoaderOptions} from './flatgeobuf-loader-definition';

/** Preloads the parser-bearing FlatGeobuf loader implementation. */
async function preload() {
  const {FlatGeobufLoaderWithParser} = await import('@loaders.gl/geospatial/flatgeobuf');
  return FlatGeobufLoaderWithParser;
}

/** Starts the browser module worker for FlatGeobuf decoding. */
function loadFlatGeobufWorker(): Worker | null {
  if (typeof Worker !== 'undefined') {
    const moduleUrl = import.meta.url;
    // Native browser workers cannot use the page's import map.
    if (moduleUrl && new URL(moduleUrl).pathname.endsWith('/dist/flatgeobuf/flatgeobuf-loader-types.js')) {
      const workerUrl = new URL('../flatgeobuf-worker.js', moduleUrl);
      return new Worker(workerUrl, {type: 'module'});
    }
    return new Worker(new URL('../workers/flatgeobuf-worker.js', import.meta.url), {type: 'module'});
  }
  return null;
}

/** Metadata-only FlatGeobuf loader with an on-demand browser worker. */
export const FlatGeobufLoader = {
  ...FlatGeobufLoaderDefinition,
  loadWorker: loadFlatGeobufWorker,
  preload
} as const;
