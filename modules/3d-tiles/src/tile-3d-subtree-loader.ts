// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {Subtree} from './types';
import {VERSION} from './lib/utils/version';

/**
 * Loader for 3D Tiles Subtree
 */
export const Tile3DSubtreeLoader = {
  dataType: null as unknown as Subtree,
  batchType: null as never,
  id: '3d-tiles-subtree',
  name: '3D Tiles Subtree',
  module: '3d-tiles',
  version: VERSION,
  extensions: ['subtree'],
  mimeTypes: ['application/octet-stream'],
  tests: ['subtree'],
  /** Loads the parser-bearing 3D Tiles Subtree loader implementation. */
  preload: async () =>
    (await import('./tile-3d-subtree-loader-with-parser')).Tile3DSubtreeLoaderWithParser,
  options: {}
} as const satisfies Loader<Subtree, never, LoaderOptions>;
