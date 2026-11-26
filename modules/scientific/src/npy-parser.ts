// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/core/loader-utils';
import {parseNPY, type NPYTile} from './lib/parsers/parse-npy';
import type {NPYLoaderOptions} from './npy-loader-types';
import {NPYLoaderDefinition} from './npy-loader-definition';

export type {NPYLoaderOptions} from './npy-loader-definition';

/**
 * Loader for numpy "tiles"
 */
export const NPYLoaderWithParser = {
  ...NPYLoaderDefinition,
  parseSync: parseNPY,
  parse: async (arrayBuffer: ArrayBuffer, options?: LoaderOptions) => parseNPY(arrayBuffer, options)
} as const satisfies LoaderWithParser<NPYTile, never, NPYLoaderOptions>;
