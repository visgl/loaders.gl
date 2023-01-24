import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import {Mesh} from '@loaders.gl/schema';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type OBJLoaderOptions = LoaderOptions & {
  obj?: {};
};

/**
 * Worker loader for the OBJ geometry format
 */
export const OBJLoader: Loader<Mesh, never, OBJLoaderOptions> = {
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

function testOBJFile(text: string): boolean {
  // TODO - There could be comment line first
  return text[0] === 'v';
}

export const _typecheckOBJLoader: Loader = OBJLoader;
