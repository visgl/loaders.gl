// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DOTLoader, type DOTLoaderOptions} from './dot-loader-types';
import {parseDOT} from './lib/parse-dot';

/** Parser-bearing loader for synchronous and asynchronous DOT parsing. */
export const DOTLoaderWithParser = {
  ...DOTLoader,
  parse: async (data: ArrayBuffer, options?: DOTLoaderOptions) =>
    parseDOT(new TextDecoder().decode(data), options?.dot?.shape ?? 'arrow-table'),
  parseSync: (data: ArrayBuffer, options?: DOTLoaderOptions) =>
    parseDOT(new TextDecoder().decode(data), options?.dot?.shape ?? 'arrow-table'),
  parseTextSync: (data: string, options?: DOTLoaderOptions) =>
    parseDOT(data, options?.dot?.shape ?? 'arrow-table')
};
