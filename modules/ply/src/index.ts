import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {PLYLoader as PLYWorkerLoader} from './ply-loader';
import parsePLY from './lib/parse-ply';
import parsePLYInBatches from './lib/parse-ply-in-batches';

// PLYLoader

export {PLYWorkerLoader};

/**
 * Loader for PLY - Polygon File Format
 */
export const PLYLoader = {
  ...PLYWorkerLoader,
  // Note: parsePLY supports both text and binary
  parse: async (arrayBuffer, options) => parsePLY(arrayBuffer, options), // TODO - this may not detect text correctly?
  parseTextSync: parsePLY,
  parseSync: parsePLY,
  parseInBatches: parsePLYInBatches
};

export const _typecheckPLYLoader: LoaderWithParser = PLYLoader;
