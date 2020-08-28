/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
import {SHP_MAGIC_NUMBER} from './shp-loader';
import {parseShapefile, parseShapefileInBatches} from './lib/parsers/parse-shapefile';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {LoaderObject} */
export const ShapefileLoader = {
  id: 'shapefile',
  name: 'Shapefile',
  category: 'geometry',
  version: VERSION,
  extensions: ['shp'],
  mimeTypes: ['application/octet-stream'],
  tests: [new Uint8Array(SHP_MAGIC_NUMBER).buffer],
  options: {
    shapefile: {}
  },
  parse: parseShapefile,
  parseInBatches: parseShapefileInBatches
};
