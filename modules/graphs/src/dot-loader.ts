// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DOTLoader} from './dot-loader-types';
import {parseDOT} from './lib/parse-dot';

/** Parser-bearing loader for synchronous and asynchronous DOT parsing. */
export const DOTLoaderWithParser = {
  ...DOTLoader,
  parse: async (data: ArrayBuffer) => parseDOT(new TextDecoder().decode(data)),
  parseSync: (data: ArrayBuffer) => parseDOT(new TextDecoder().decode(data)),
  parseTextSync: parseDOT
};
