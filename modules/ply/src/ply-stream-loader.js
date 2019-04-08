// description: 'PLY - Polygon File Format (aka Stanford Triangle Format)'
// links: ['http://paulbourke.net/dataformats/ply/',
// 'https://en.wikipedia.org/wiki/PLY_(file_format)']

import parsePLYStream from './parser/parse-ply-stream';

const DEFAULT_OPTIONS = {};

export default {
  name: 'PLY',
  extensions: ['ply'],
  parseAsIterator: parsePLYStream,
  DEFAULT_OPTIONS
};
