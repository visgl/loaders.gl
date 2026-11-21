// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {JSONTableLoader} from './json/json-table-loader-types.js';
import {JSONTableLoaderWithParser as parser} from './json/json-table-loader.js';

export * from './json/json-table-loader.js';

/** Parser-bearing JSONTable loader with its browser module worker factory. */
export const JSONTableLoaderWithParser = {
  ...parser,
  loadWorker: JSONTableLoader.loadWorker
};
export {convertJSONToArrow} from './json/lib/parsers/convert-json-to-arrow.js';
export type {ConvertJSONToArrowOptions} from './json/lib/parsers/convert-json-to-arrow.js';
