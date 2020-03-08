// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
/* global TextDecoder */
import loadOBJ from './lib/load-obj';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const OBJWorkerLoader = {
  id: 'obj',
  name: 'OBJ',
  version: VERSION,
  extensions: ['obj'],
  mimeType: 'text/plain',
  testText: testOBJFile,
  options: {
    obj: {
      workerUrl: `https://unpkg.com/@loaders.gl/obj@${VERSION}/dist/obj-loader.worker.js`
    }
  }
};

export const OBJLoader = {
  ...OBJWorkerLoader,
  parse: async (arrayBuffer, options) => loadOBJ(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: loadOBJ
};

function testOBJFile(text) {
  // TODO - There could be comment line first
  return text[0] === 'v';
}
