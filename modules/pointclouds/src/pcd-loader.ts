// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {PCDLoader} from './pcd/pcd-loader-types.js';
import {PCDLoaderWithParser as parser} from './pcd/pcd-loader.js';

/** Parser-bearing PCD loader with its browser module worker factory. */
export const PCDLoaderWithParser = {
  ...parser,
  loadWorker: PCDLoader.loadWorker
};
