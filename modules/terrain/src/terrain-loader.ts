import type {Loader} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';

/**
 * Worker loader for quantized meshes
 */
export const TerrainLoader = {
  name: 'Terrain',
  id: 'terrain',
  module: 'terrain',
  version: VERSION,
  worker: true,
  extensions: ['png', 'pngraw'],
  mimeTypes: ['image/png'],
  options: {
    terrain: {
      tesselator: 'auto',
      bounds: null,
      meshMaxError: 10,
      elevationDecoder: {
        rScaler: 1,
        gScaler: 0,
        bScaler: 0,
        offset: 0
      },
      skirtHeight: null
    }
  }
};

/**
 * Loader for quantized meshes
 */
export const _typecheckTerrainWorkerLoader: Loader = TerrainLoader;
