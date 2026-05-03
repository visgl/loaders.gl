// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Subtree} from './types';
import parse3DTilesSubtree from './lib/parsers/helpers/parse-3d-tile-subtree';
import {Tile3DSubtreeLoader as Tile3DSubtreeLoaderMetadata} from './tile-3d-subtree-loader';

const {preload: _Tile3DSubtreeLoaderPreload, ...Tile3DSubtreeLoaderMetadataWithoutPreload} =
  Tile3DSubtreeLoaderMetadata;

/**
 * Loader for 3D Tiles Subtree
 */
export const Tile3DSubtreeLoaderWithParser = {
  ...Tile3DSubtreeLoaderMetadataWithoutPreload,
  parse: parse3DTilesSubtree
} as const satisfies LoaderWithParser<Subtree, never, LoaderOptions>;
