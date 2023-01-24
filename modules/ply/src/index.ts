// loaders.gl, MIT license

import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {PLYMesh} from './lib/ply-types';
import {PLYLoader as PLYWorkerLoader} from './ply-loader';
import {parsePLY} from './lib/parse-ply';
import {parsePLYInBatches} from './lib/parse-ply-in-batches';

// PLYLoader

export {PLYWorkerLoader};

/**
 * Loader for PLY - Polygon File Format
 */
export const PLYLoader: LoaderWithParser<PLYMesh, any, LoaderOptions> = {
  ...PLYWorkerLoader,
  // Note: parsePLY supports both text and binary
  parse: async (arrayBuffer, options) => parsePLY(arrayBuffer, options?.ply), // TODO - this may not detect text correctly?
  parseTextSync: (arrayBuffer, options) => parsePLY(arrayBuffer, options?.ply),
  parseSync: (arrayBuffer, options) => parsePLY(arrayBuffer, options?.ply),
  parseInBatches: (arrayBuffer, options) => parsePLYInBatches(arrayBuffer, options?.ply)
};

export const _typecheckPLYLoader: LoaderWithParser = PLYLoader;
