// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Subtree} from './types';
import parse3DTilesSubtree from './lib/parsers/helpers/parse-3d-tile-subtree';
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
  parse: parse3DTilesSubtree,
  options: {}
} as const satisfies LoaderWithParser<Subtree, never, LoaderOptions>;
