import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import loadOBJ from './lib/load-obj';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Worker loader for the OBJ geometry format
 */
export const OBJWorkerLoader = {
  name: 'OBJ',
  id: 'obj',
  module: 'obj',
  version: VERSION,
  worker: true,
  extensions: ['obj'],
  mimeTypes: ['text/plain'],
  testText: testOBJFile,
  options: {
    obj: {}
  }
};

/**
 * Loader for the OBJ geometry format
 */
export const OBJLoader = {
  ...OBJWorkerLoader,
  parse: async (arrayBuffer, options) => loadOBJ(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: loadOBJ
};

function testOBJFile(text) {
  // TODO - There could be comment line first
  return text[0] === 'v';
}

export const _typecheckOBJWorkerLoader: Loader = OBJWorkerLoader;
export const _typecheckOBJLoader: LoaderWithParser = OBJLoader;
