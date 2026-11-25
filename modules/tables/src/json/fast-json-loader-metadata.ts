// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RecordBatch} from 'apache-arrow';
import type {TableBatch} from '@loaders.gl/core/schema';
import type {MetadataBatch, JSONBatch} from './json-loader-types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Shared metadata for FastJSONLoader. */
export const FastJSONLoaderMetadata = {
  dataType: null as unknown,
  batchType: null as unknown as TableBatch | RecordBatch | MetadataBatch | JSONBatch,
  name: 'Fast JSON',
  id: 'fast-json',
  module: 'tables',
  version: VERSION,
  extensions: ['json', 'geojson'] as string[],
  mimeTypes: ['application/json'] as string[],
  category: 'table',
  text: true,
  options: {
    json: {
      backend: 'fast',
      shape: undefined,
      table: false,
      jsonpaths: [] as string[]
    }
  }
} as const;

/** Defers the FastJSONLoader parser until first use. */
export const FastJSONLoader = {
  ...FastJSONLoaderMetadata,
  async preload() {
    const implementation = await import('./fast-json-loader.js');
    return implementation.FastJSONLoader;
  }
} as const;
