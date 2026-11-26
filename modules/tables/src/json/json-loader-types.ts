// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {JSONLoaderDefinition} from './json-loader-definition';
import {loadJSONWorker} from './load-json-worker';

export type {MetadataBatch, JSONBatch, JSONLoaderOptions} from './json-loader-definition';

/** Preloads the parser-bearing JSON loader implementation. */
async function preload() {
  const {JSONLoaderWithParser} = await import('@loaders.gl/tables/json/parser');
  return JSONLoaderWithParser;
}

/** Metadata-only JSON loader with an on-demand browser worker. */
export const JSONLoader = {
  ...JSONLoaderDefinition,
  loadWorker: loadJSONWorker,
  preload
} as const;
