// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NPYLoader} from './npy-loader-types.js';
import {NPYLoaderWithParser as parser} from './npy-parser.js';

export * from './npy-parser.js';

/** Parser-bearing NPY loader with its browser module worker factory. */
export const NPYLoaderWithParser = {
  ...parser,
  loadWorker: NPYLoader.loadWorker
};
