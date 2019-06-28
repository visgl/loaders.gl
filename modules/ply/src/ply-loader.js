// description: 'PLY - Polygon File Format (aka Stanford Triangle Format)'
// links: ['http://paulbourke.net/dataformats/ply/',
// 'https://en.wikipedia.org/wiki/PLY_(file_format)']

import parsePLY from './parser/parse-ply';

const DEFAULT_OPTIONS = {};

export default {
  name: 'PLY',
  extensions: ['ply'],
  text: true,
  binary: true,
  test: 'ply',
  // Note: parsePLY supports both text and binary
  parseTextSync: parsePLY,
  parseSync: parsePLY,
  DEFAULT_OPTIONS
};
