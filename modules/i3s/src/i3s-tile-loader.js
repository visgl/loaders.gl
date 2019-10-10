/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
import {parseI3STile} from './lib/parse-i3s-tile';

async function parse(arrayBuffer, options, context, loader) {
  const tile = {};
  const byteOffset = 0;
  await parseI3STile(arrayBuffer, byteOffset, options, context, tile);
  return tile;
}

export const I3STileLoader = {
  id: 'i3s',
  name: 'i3s',
  version: VERSION,
  extensions: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  mimeType: 'application/octet-stream',
  test: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  parse,
  binary: true,
  options: {
    i3s: {
      loadGLTF: true,
      decodeQuantizedPositions: false
    }
  }
};
