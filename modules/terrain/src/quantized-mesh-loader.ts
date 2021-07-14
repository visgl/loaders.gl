import type {Loader} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';

/**
 * Worker loader for quantized meshes
 */
export const QuantizedMeshLoader = {
  name: 'Quantized Mesh',
  id: 'quantized-mesh',
  module: 'terrain',
  version: VERSION,
  worker: true,
  extensions: ['terrain'],
  mimeTypes: ['application/vnd.quantized-mesh'],
  options: {
    'quantized-mesh': {
      bounds: [0, 0, 1, 1],
      skirtHeight: null
    }
  }
};

export const _typecheckQuantizedMeshLoader: Loader = QuantizedMeshLoader;
