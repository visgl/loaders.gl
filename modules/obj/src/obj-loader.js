/* global TextDecoder */
/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
import loadOBJ from './lib/load-obj';

const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const OBJ = {
  id: 'obj',
  name: 'OBJ',
  version: VERSION,
  extensions: ['obj'],
  mimeType: 'text/plain',
  testText: testOBJFile
};

export const OBJLoader = {
  ...OBJ,
  parse: async (arrayBuffer, options) => loadOBJ(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: loadOBJ
};

export const OBJWorkerLoader = {
  ...OBJ,
  options: {
    obj: {
      workerUrl: `https://unpkg.com/@loaders.gl/obj@${VERSION}/dist/obj-loader.worker.js`
    }
  }
};

function testOBJFile(text) {
  // TODO - There could be comment line first
  return text[0] === 'v';
}
