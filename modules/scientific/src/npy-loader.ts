// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/core/loader-utils';
import {parseNPY, type NPYTile} from './lib/parsers/parse-npy';
import type {NPYLoaderOptions} from './npy-loader-types';
import {NPYLoader as NPYLoaderMetadata} from './npy-loader-types';

const {preload: _preload, ...metadata} = NPYLoaderMetadata;

export type {NPYLoaderOptions} from './npy-loader-types';

/**
 * Loader for numpy "tiles"
 */
export const NPYLoaderWithParser = {
  ...metadata,
  parseSync: parseNPY,
  parse: async (arrayBuffer: ArrayBuffer, options?: LoaderOptions) => parseNPY(arrayBuffer, options)
} as const satisfies LoaderWithParser<NPYTile, never, NPYLoaderOptions>;
