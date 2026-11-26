// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {PLYLoader} from './ply/ply-loader-types.js';
import {PLYLoaderWithParser as parser} from './ply/ply-loader.js';

/** Parser-bearing PLY loader with its browser module worker factory. */
export const PLYLoaderWithParser = {
  ...parser,
  loadWorker: PLYLoader.loadWorker
};
