// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GraphMLLoader, type GraphMLLoaderOptions} from './graphml-loader-types';
import {parseGraphML} from './lib/parse-graphml';

/** Parser-bearing loader for synchronous and asynchronous GraphML parsing. */
export const GraphMLLoaderWithParser = {
  ...GraphMLLoader,
  parse: async (data: ArrayBuffer, options?: GraphMLLoaderOptions) =>
    parseGraphML(data, options?.graphml?.shape ?? 'arrow'),
  parseSync: (data: ArrayBuffer, options?: GraphMLLoaderOptions) =>
    parseGraphML(data, options?.graphml?.shape ?? 'arrow'),
  parseTextSync: (data: string, options?: GraphMLLoaderOptions) =>
    parseGraphML(data, options?.graphml?.shape ?? 'arrow')
};
