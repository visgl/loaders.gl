import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import parse3DTilesSubtree from './lib/parsers/helpers/parse-3d-tile-subtree';
import {VERSION} from './lib/utils/version';

/**
 * Loader for 3D Tiles Subtree
 *
 */
export const Tile3DSubtreeLoader: LoaderWithParser = {
  id: '3d-tiles-subtree',
  name: '3D Tiles Subtree',
  module: '3d-tiles',
  version: VERSION,
  extensions: ['subtree'],
  mimeTypes: ['application/octet-stream'],
  tests: ['subtree'],
  parse: parse3DTilesSubtree,
  options: {}
};
