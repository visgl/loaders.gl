/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

import {parsePgm} from './lib/pgm-parser';

/** @type {LoaderObject} */
const PGMLoader = {
  id: 'pgm',
  name: 'PGM - Netpbm grayscale image format',
  version: VERSION,
  mimeTypes: ['image/x-portable-graymap'],
  parse,
  extensions: ['pgm'],
  options: {
    cubic: false
  }
};

async function parse(data, options) {
  const model = parsePgm(new Uint8Array(data), options);
  return model;
}

export default PGMLoader;
