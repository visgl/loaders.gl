// description: 'PLY - Polygon File Format (aka Stanford Triangle Format)'
// links: ['http://paulbourke.net/dataformats/ply/',
// 'https://en.wikipedia.org/wiki/PLY_(file_format)']

import parsePLY from './parse-ply';

const DEFAULT_OPTIONS = {
  normalize: true,
  faceNormal: true,
  vertexNormal: true,
  flip: true
};

export default {
  name: 'PLY',
  extension: 'ply',
  // Note: parsePLY supports both text and binary
  parseTextSync: parsePLY,
  parseSync: parsePLY,
  DEFAULT_OPTIONS
};
