// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CSVLoader} from './csv/csv-loader-types.js';
import {CSVLoaderWithParser as parser} from './csv/csv-loader.js';

export * from './csv/csv-loader.js';

/** Parser-bearing CSV loader with its browser module worker factory. */
export const CSVLoaderWithParser = {
  ...parser,
  loadWorker: CSVLoader.loadWorker
};
