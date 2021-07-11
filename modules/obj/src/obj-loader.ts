import type {Loader} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Worker loader for the OBJ geometry format
 */
export const OBJLoader = {
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

function testOBJFile(text) {
  // TODO - There could be comment line first
  return text[0] === 'v';
}

export const _typecheckOBJLoader: Loader = OBJLoader;
