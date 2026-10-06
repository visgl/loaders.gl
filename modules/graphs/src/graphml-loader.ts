// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GraphMLLoader} from './graphml-loader-types';
import {parseGraphML} from './lib/parse-graphml';

/** Parser-bearing loader for synchronous and asynchronous GraphML parsing. */
export const GraphMLLoaderWithParser = {
  ...GraphMLLoader,
  parse: async (data: ArrayBuffer) => parseGraphML(data),
  parseSync: parseGraphML,
  parseTextSync: parseGraphML
};
