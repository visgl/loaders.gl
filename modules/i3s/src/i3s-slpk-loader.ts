// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** options to load data from SLPK */
export type SLPKLoaderOptions = LoaderOptions & {
  slpk?: {
    /** path inside the slpk archive */
    path?: string;
    /** mode of the path */
    pathMode?: 'http' | 'raw';
  };
};

/**
 * Loader for SLPK - Scene Layer Package (Archive I3S format)
 * @todo - this reloads the entire archive for every tile, should be optimized
 * @todo - this should be updated to use `parseFile` and ReadableFile
 */
export const SLPKLoader = {
  dataType: null as unknown as ArrayBuffer,
  batchType: null as never,

  name: 'I3S SLPK (Scene Layer Package)',
  id: 'slpk',
  module: 'i3s',
  version: VERSION,
  mimeTypes: ['application/octet-stream'],
  extensions: ['slpk'],
  options: {
    slpk: {
      path: '',
      pathMode: undefined
    }
  },
  /** Loads the parser-bearing SLPK loader implementation. */
  preload: async () => (await import('./i3s-slpk-loader-with-parser')).SLPKLoaderWithParser
} as const satisfies Loader<ArrayBuffer, never, SLPKLoaderOptions>;
