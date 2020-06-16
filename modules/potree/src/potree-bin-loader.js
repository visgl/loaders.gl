import {default as parsePotreeBin} from './parsers/parse-potree-bin';
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

function parseSync(arrayBuffer, options, url, loader) {
  const index = {};
  const byteOffset = 0;
  parsePotreeBin(arrayBuffer, byteOffset, options, index);
  return index;
}

/** @type {LoaderObject} */
export default {
  id: 'potree',
  name: 'potree Binary Point Attributes',
  extensions: ['bin'],
  mimeTypes: ['application/octet-stream'],
  // Unfortunately binary potree files have no header bytes, no test possible
  // test: ['...'],
  parseSync,
  binary: true
};
