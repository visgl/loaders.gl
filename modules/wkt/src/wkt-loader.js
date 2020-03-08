// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
/* global TextDecoder */
import parseWKT from './lib/parse-wkt';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const WKTLoader = {
  id: 'wkt',
  name: 'WKT',
  version: VERSION,
  extensions: ['wkt'],
  mimeType: 'text/plain',
  category: 'geometry',
  parse: async (arrayBuffer, options) => parseWKT(new TextDecoder().decode(arrayBuffer)),
  parseTextSync: parseWKT,
  testText: null,
  text: true,
  options: {
    wkt: {}
  }
};
