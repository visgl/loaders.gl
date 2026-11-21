// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {JSONLoader} from './json/json-loader-types.js';
import {JSONLoaderWithParser as parser} from './json/json-loader.js';

export * from './json/json-loader.js';

/** Parser-bearing JSON loader with its browser module worker factory. */
export const JSONLoaderWithParser = {
  ...parser,
  loadWorker: JSONLoader.loadWorker
};
