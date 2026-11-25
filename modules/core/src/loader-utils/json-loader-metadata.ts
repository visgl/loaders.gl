// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table, TableBatch} from '@loaders.gl/core/schema';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Shared metadata for JSONLoader. */
export const JSONLoaderMetadata = {
  dataType: null as unknown as Table,
  batchType: null as unknown as TableBatch,
  name: 'JSON',
  id: 'json',
  module: 'json',
  version: VERSION,
  encoding: 'json',
  format: 'json',
  extensions: ['json', 'geojson'] as string[],
  mimeTypes: ['application/json'] as string[],
  category: 'json',
  text: true,
  options: {}
} as const;

/** Defers the JSONLoader parser until first use. */
export const JSONLoader = {
  ...JSONLoaderMetadata,
  async preload() {
    const implementation = await import('./json-loader.js');
    return implementation.JSONLoader;
  }
} as const;
