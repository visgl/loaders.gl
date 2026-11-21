// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ArrowLoader} from './arrow/arrow-loader-types.js';
import {ArrowLoaderWithParser as parser} from './arrow/arrow-loader.js';

export * from './arrow/arrow-loader.js';

/** Parser-bearing Arrow loader with its browser module worker factory. */
export const ArrowLoaderWithParser = {
  ...parser,
  loadWorker: ArrowLoader.loadWorker
};
