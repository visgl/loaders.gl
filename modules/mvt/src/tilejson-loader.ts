// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {TileJSON} from './lib/parse-tilejson';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type TileJSONLoaderOptions = LoaderOptions & {
  /** Options for the TileJSONLoader */
  tilejson?: {
    /** Max number of unique values */
    maxValues?: number;
  };
};

/** Preloads the parser-bearing TileJSON loader implementation. */
async function preload() {
  const {TileJSONLoaderWithParser} = await import('./tilejson-loader-with-parser');
  return TileJSONLoaderWithParser;
}

/** Metadata-only loader for TileJSON metadata. */
export const TileJSONLoader = {
  dataType: null as unknown as TileJSON,
  batchType: null as never,

  name: 'TileJSON',
  id: 'tilejson',
  module: 'pmtiles',
  version: VERSION,
  worker: true,
  workerFile: 'mvt-classic.js',
  workerModuleFile: 'mvt-module.js',
  workerNodeFile: 'mvt-classic-node.cjs',
  workerPackage: 'mvt',
  extensions: ['json'],
  mimeTypes: ['application/json'],
  text: true,
  options: {
    tilejson: {
      maxValues: undefined
    }
  },
  preload
} as const satisfies Loader<TileJSON, never, TileJSONLoaderOptions>;
