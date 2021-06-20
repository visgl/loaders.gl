import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {default as parsePotreeBin} from './parsers/parse-potree-bin';

/**
 * Loader for potree Binary Point Attributes
 * */
// @ts-ignore
export const PotreeBinLoader: LoaderWithParser = {
  name: 'potree Binary Point Attributes',
  id: 'potree',
  extensions: ['bin'],
  mimeTypes: ['application/octet-stream'],
  // Unfortunately binary potree files have no header bytes, no test possible
  // test: ['...'],
  parseSync,
  binary: true
};

function parseSync(arrayBuffer, options) {
  const index = {};
  const byteOffset = 0;
  parsePotreeBin(arrayBuffer, byteOffset, options, index);
  return index;
}
