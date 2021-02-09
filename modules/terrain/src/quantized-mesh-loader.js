/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
import {VERSION} from './lib/utils/version';
import parseQuantizedMesh from './lib/parse-quantized-mesh';

/**
 * Worker loader for quantized meshes
 * @type {WorkerLoaderObject}
 */
export const QuantizedMeshWorkerLoader = {
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
 * @type {LoaderObject}
 */
export const QuantizedMeshLoader = {
  ...QuantizedMeshWorkerLoader,
  parseSync: parseQuantizedMesh,
  parse: async (arrayBuffer, options) => parseQuantizedMesh(arrayBuffer, options)
};
