/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
import {default as parsePotreeBin} from './parsers/parse-potree-bin';

/**
 * Loader for potree Binary Point Attributes
 * @type {LoaderObject}
 * */
// @ts-ignore
export const PotreeBinLoader = {
  name: 'potree Binary Point Attributes',
  id: 'potree',
  extensions: ['bin'],
  mimeTypes: ['application/octet-stream'],
  // Unfortunately binary potree files have no header bytes, no test possible
  // test: ['...'],
  parseSync,
  binary: true
};

function parseSync(arrayBuffer, options, url, loader) {
  const index = {};
  const byteOffset = 0;
  parsePotreeBin(arrayBuffer, byteOffset, options, index);
  return index;
}
