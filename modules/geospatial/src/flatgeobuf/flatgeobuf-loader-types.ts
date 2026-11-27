// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {FlatGeobufLoaderDefinition} from './flatgeobuf-loader-definition';

export type {FlatGeobufLoaderOptions} from './flatgeobuf-loader-definition';

/** Preloads the parser-bearing FlatGeobuf loader implementation. */
async function preload() {
  const {FlatGeobufLoaderWithParser} = await import('@loaders.gl/geospatial/flatgeobuf/parser');
  return FlatGeobufLoaderWithParser;
}

/** Starts the browser module worker for FlatGeobuf decoding. */
function loadFlatGeobufWorker(): Worker | null {
  if (typeof Worker !== 'undefined') {
    return new Worker(new URL('../flatgeobuf-worker.js', import.meta.url), {type: 'module'});
  }
  return null;
}

/** Metadata-only FlatGeobuf loader with an on-demand browser worker. */
export const FlatGeobufLoader = {
  ...FlatGeobufLoaderDefinition,
  loadWorker: loadFlatGeobufWorker,
  preload
} as const;
