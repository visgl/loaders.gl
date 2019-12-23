/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
/* global TextDecoder */
import parseWKT from './lib/parse-wkt';

const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const WKTLoader = {
  id: 'wkt',
  name: 'WKT',
  version: VERSION,
  extensions: ['wkt'],
  mimeType: 'text/plain',
  category: 'geometry',
  parse: async (arrayBuffer, options) => parseWKT(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: parseWKT,
  testText: null,
  text: true,
  options: {
    wkt: {}
  }
};
