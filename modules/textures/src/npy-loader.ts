// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {parseNPY, NPYTile} from './lib/parsers/parse-npy';

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

/**
 * Worker loader for numpy "tiles"
 */
export const NPYWorkerLoader = {
  dataType: null as any as NPYTile,
  batchType: null as never,

  name: 'NPY',
  id: 'npy',
  module: 'textures',
  version: VERSION,
  worker: true,
  extensions: ['npy'],
  mimeTypes: [],
  tests: [NPY_MAGIC_NUMBER.buffer],
  options: {
    npy: {}
  }
} as const satisfies Loader<NPYTile, never, NPYLoaderOptions>;

/**
 * Loader for numpy "tiles"
 */
export const NPYLoader = {
  ...NPYWorkerLoader,
  parseSync: parseNPY,
  parse: async (arrayBuffer: ArrayBuffer, options?: LoaderOptions) => parseNPY(arrayBuffer, options)
} as const satisfies LoaderWithParser<any, any, NPYLoaderOptions>;
