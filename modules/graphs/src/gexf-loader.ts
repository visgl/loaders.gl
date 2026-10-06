// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GEXFLoader, type GEXFLoaderOptions} from './gexf-loader-types';
import {parseGEXF} from './lib/parse-gexf';

/** Parser-bearing loader for synchronous and asynchronous GEXF parsing. */
export const GEXFLoaderWithParser = {
  ...GEXFLoader,
  parse: async (data: ArrayBuffer, options?: GEXFLoaderOptions) =>
    parseGEXF(data, options?.gexf?.shape ?? 'arrow-table'),
  parseSync: (data: ArrayBuffer, options?: GEXFLoaderOptions) =>
    parseGEXF(data, options?.gexf?.shape ?? 'arrow-table'),
  parseTextSync: (data: string, options?: GEXFLoaderOptions) =>
    parseGEXF(data, options?.gexf?.shape ?? 'arrow-table')
};
