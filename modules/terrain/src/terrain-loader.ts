import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import loadTerrain from './lib/parse-terrain';

/**
 * Worker loader for quantized meshes
 */
export const TerrainWorkerLoader: Loader = {
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
      }
    }
  }
};

/**
 * Loader for quantized meshes
 */
export const TerrainLoader: LoaderWithParser = {
  ...TerrainWorkerLoader,
  parse: loadTerrain
};
