// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NDJSONLoader} from './json/ndjson-loader-types.js';
import {NDJSONLoaderWithParser as parser} from './json/ndjson-loader.js';

export * from './json/ndjson-loader.js';

/** Parser-bearing NDJSON loader with its browser module worker factory. */
export const NDJSONLoaderWithParser = {
  ...parser,
  loadWorker: NDJSONLoader.loadWorker
};
