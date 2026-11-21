// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OBJLoader} from './obj/obj-loader-types.js';
import {OBJLoaderWithParser as parser} from './obj/obj-loader.js';

export * from './obj/obj-loader.js';

/** Parser-bearing OBJ loader with its browser module worker factory. */
export const OBJLoaderWithParser = {
  ...parser,
  loadWorker: OBJLoader.loadWorker
};
