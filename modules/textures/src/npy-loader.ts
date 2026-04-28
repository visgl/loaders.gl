// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import type {NPYTile} from './lib/parsers/parse-npy';

// \x93NUMPY
const NPY_MAGIC_NUMBER = new Uint8Array([147, 78, 85, 77, 80, 89]);

/** NPYLoader for numpy tiles */
export type NPYLoaderOptions = LoaderOptions & {
  /** NPYLoader for numpy tiles */
  npy?: {
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/** Preloads the parser-bearing NPY loader implementation. */
async function preload() {
  const {NPYLoaderWithParser} = await import('./npy-loader-with-parser');
  return NPYLoaderWithParser;
}

/** Metadata-only worker loader for numpy "tiles". */
export const NPYWorkerLoader = {
  dataType: null as any as NPYTile,
  batchType: null as never,

  name: 'NPY',
  id: 'npy',
  module: 'textures',
  version: VERSION,
  worker: true,
  workerFile: 'textures-classic.js',
  workerModuleFile: 'textures-module.js',
  workerNodeFile: 'textures-classic-node.cjs',
  extensions: ['npy'],
  mimeTypes: [],
  tests: [NPY_MAGIC_NUMBER.buffer],
  options: {
    npy: {}
  },
  preload
} as const satisfies Loader<NPYTile, never, NPYLoaderOptions>;

/** Metadata-only loader for numpy "tiles". */
export const NPYLoader = {
  ...NPYWorkerLoader,
  preload
} as const satisfies Loader<any, any, NPYLoaderOptions>;
