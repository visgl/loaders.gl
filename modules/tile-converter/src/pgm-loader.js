/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

import {parsePgm} from './lib/pgm-parser';

/**
 * Loader for PGM - Netpbm grayscale image format
 * @type {LoaderObject}
 */
export const PGMLoader = {
  name: 'PGM - Netpbm grayscale image format',
  id: 'pgm',
  module: 'tile-converter',
  version: VERSION,
  mimeTypes: ['image/x-portable-graymap'],
  parse: (arrayBuffer, options) => parsePgm(new Uint8Array(arrayBuffer), options),
  extensions: ['pgm'],
  options: {
    // TODO - use pgm namespace
    cubic: false
  }
};
