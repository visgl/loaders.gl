import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import parseQuantizedMesh from './lib/parse-quantized-mesh';

/**
 * Worker loader for quantized meshes
 */
export const QuantizedMeshWorkerLoader: Loader = {
  name: 'Quantized Mesh',
  id: 'quantized-mesh',
  module: 'terrain',
  version: VERSION,
  worker: true,
  extensions: ['terrain'],
  mimeTypes: ['application/vnd.quantized-mesh'],
  options: {
    'quantized-mesh': {
      bounds: [0, 0, 1, 1]
    }
  }
};

/**
 * Loader for quantized meshes
 */
export const QuantizedMeshLoader: LoaderWithParser = {
  ...QuantizedMeshWorkerLoader,
  parseSync: parseQuantizedMesh,
  parse: async (arrayBuffer, options) => parseQuantizedMesh(arrayBuffer, options)
};
