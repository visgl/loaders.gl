// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
import parseWKB from './lib/parse-wkb';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const WKBWorkerLoader = {
  id: 'wkb',
  name: 'WKB',
  version: VERSION,
  extensions: ['wkb'],
  category: 'geometry',
  options: {
    wkb: {
      workerUrl: `https://unpkg.com/@loaders.gl/wkb@${VERSION}/dist/wkb-loader.worker.js`
    }
  }
};

export const WKBLoader = {
  ...WKBWorkerLoader,
  parse: async (arrayBuffer, options) => parseWKB(arrayBuffer),
  parseSync: parseWKB
};
