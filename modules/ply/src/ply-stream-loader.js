// description: 'PLY - Polygon File Format (aka Stanford Triangle Format)'
// links: ['http://paulbourke.net/dataformats/ply/',
// 'https://en.wikipedia.org/wiki/PLY_(file_format)']

import parsePLYStream from './lib/parse-ply-stream';

export default {
  name: 'PLY',
  extensions: ['ply'],
  parseStream: parsePLYStream,
  options: {}
};
