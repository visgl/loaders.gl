"use strict";var parsePLYStream;module.link('./parser/parse-ply-stream',{default(v){parsePLYStream=v}},0);// description: 'PLY - Polygon File Format (aka Stanford Triangle Format)'
// links: ['http://paulbourke.net/dataformats/ply/',
// 'https://en.wikipedia.org/wiki/PLY_(file_format)']



const DEFAULT_OPTIONS = {};

module.exportDefault({
  name: 'PLY',
  extensions: ['ply'],
  parseAsIterator: parsePLYStream,
  DEFAULT_OPTIONS
});
