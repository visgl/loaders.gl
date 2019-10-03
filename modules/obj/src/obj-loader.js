/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
/* global TextDecoder */
import loadOBJ from './lib/load-obj';

const OBJ = {
  id: 'obj',
  name: 'OBJ',
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
      workerUrl: `https://unpkg.com/@loaders.gl/obj@${__VERSION__}/dist/obj-loader.worker.js`
    }
  }
};

function testOBJFile(text) {
  // TODO - There could be comment line first
  return text[0] === 'v';
}
