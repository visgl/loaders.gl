import {default as parsePotreeBin} from './parsers/parse-potree-bin';

function parseSync(arrayBuffer, options, url, loader) {
  const index = {};
  const byteOffset = 0;
  parsePotreeBin(arrayBuffer, byteOffset, options, index);
  return index;
}

export default {
  id: 'potree',
  name: 'potree Binary Point Attributes',
  extensions: ['bin'],
  mimeType: 'application/octet-stream',
  // Unfortunately binary potree files have no header bytes, no test possible
  // test: ['...'],
  parseSync,
  binary: true
};
