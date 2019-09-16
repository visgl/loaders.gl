// description: 'PLY - Polygon File Format (aka Stanford Triangle Format)'
// links: ['http://paulbourke.net/dataformats/ply/',
// 'https://en.wikipedia.org/wiki/PLY_(file_format)']

import parsePLY from './lib/parse-ply';

const DEFAULT_OPTIONS = {};

export default {
  name: 'PLY',
  extensions: ['ply'],
  mimeType: 'text/plain',
  // mimeType: 'application/octet-stream', TODO - binary version?
  text: true,
  binary: true,
  test: 'ply',
  // Note: parsePLY supports both text and binary
  parse: async (arrayBuffer, options) => parsePLY(arrayBuffer, options), // TODO - this may not detect text correctly?
  parseTextSync: parsePLY,
  parseSync: parsePLY,
  DEFAULT_OPTIONS
};
