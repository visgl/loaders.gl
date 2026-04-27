// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {Subtree} from './types';
import {VERSION} from './lib/utils/version';
import {Tile3DSubtreeFormat} from './tiles-3d-format';

/**
 * Loader for 3D Tiles Subtree
 */
export const Tile3DSubtreeLoader = {
  dataType: null as unknown as Subtree,
  batchType: null as never,
  ...Tile3DSubtreeFormat,
  version: VERSION,
  /** Loads the parser-bearing 3D Tiles Subtree loader implementation. */
  preload: async () =>
    (await import('./tile-3d-subtree-loader-with-parser')).Tile3DSubtreeLoaderWithParser,
  options: {}
} as const satisfies Loader<Subtree, never, LoaderOptions>;
