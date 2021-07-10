import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import loadOBJ from './lib/load-obj';
import {OBJLoader as OBJWorkerLoader} from './obj-loader';

// OBJLoader

export {OBJWorkerLoader};

/**
 * Loader for the OBJ geometry format
 */
export const OBJLoader = {
  ...OBJWorkerLoader,
  parse: async (arrayBuffer, options) => loadOBJ(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: loadOBJ
};

export const _typecheckOBJLoader: LoaderWithParser = OBJLoader;
