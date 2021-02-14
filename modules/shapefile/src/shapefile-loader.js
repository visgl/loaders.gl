/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
import {SHP_MAGIC_NUMBER} from './shp-loader';
import {parseShapefile, parseShapefileInBatches} from './lib/parsers/parse-shapefile';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Shapefile loader
 * @note Shapefile is multifile format and requires providing additional files
 * @type {LoaderObject}
 */
export const ShapefileLoader = {
  name: 'Shapefile',
  id: 'shapefile',
  module: 'shapefile',
  version: VERSION,
  category: 'geometry',
  extensions: ['shp'],
  mimeTypes: ['application/octet-stream'],
  tests: [new Uint8Array(SHP_MAGIC_NUMBER).buffer],
  options: {
    shapefile: {},
    shp: {
      _maxDimensions: 4
    }
  },
  parse: parseShapefile,
  parseInBatches: parseShapefileInBatches
};
