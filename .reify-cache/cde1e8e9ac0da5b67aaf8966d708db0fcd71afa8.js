"use strict";var parsePLY;module.link('./parser/parse-ply',{default(v){parsePLY=v}},0);// description: 'PLY - Polygon File Format (aka Stanford Triangle Format)'
// links: ['http://paulbourke.net/dataformats/ply/',
// 'https://en.wikipedia.org/wiki/PLY_(file_format)']



const DEFAULT_OPTIONS = {};

module.exportDefault({
  name: 'PLY',
  extensions: ['ply'],
  // Note: parsePLY supports both text and binary
  parseTextSync: parsePLY,
  parseSync: parsePLY,
  text: true,
  binary: true,
  DEFAULT_OPTIONS
});
