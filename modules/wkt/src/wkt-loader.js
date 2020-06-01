// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
/* global TextDecoder */
import parseWKT from './lib/parse-wkt';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const WKTWorkerLoader = {
  id: 'wkt',
  name: 'WKT',
  version: VERSION,
  extensions: ['wkt'],
  mimeType: 'text/plain',
  category: 'geometry',
  testText: null,
  text: true,
  options: {
    wkt: {
      workerUrl: `https://unpkg.com/@loaders.gl/wkt@${VERSION}/dist/wkt-loader.worker.js`
    }
  }
};

export const WKTLoader = {
  ...WKTWorkerLoader,
  parse: async (arrayBuffer, options) => parseWKT(new TextDecoder().decode(arrayBuffer)),
  parseTextSync: parseWKT
};
