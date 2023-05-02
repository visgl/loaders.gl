import type {Loader} from '@loaders.gl/loader-utils';
import type {ImageLoaderOptions} from '@loaders.gl/images';
import {VERSION} from './lib/utils/version';

import {TerrainOptions} from './lib/parse-terrain';
import {Mesh} from '@loaders.gl/schema';

export type TerrainLoaderOptions = ImageLoaderOptions & {
  terrain?: TerrainOptions;
};

/**
 * Worker loader for image encoded terrain
 */
export const TerrainLoader: Loader<Mesh, never, TerrainLoaderOptions> = {
  name: 'Terrain',
  id: 'terrain',
  module: 'terrain',
  version: VERSION,
  worker: true,
  extensions: ['png', 'pngraw', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'],
  mimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp'],
  options: {
    terrain: {
      tesselator: 'auto',
      bounds: undefined!,
      meshMaxError: 10,
      elevationDecoder: {
        rScaler: 1,
        gScaler: 0,
        bScaler: 0,
        offset: 0
      },
      skirtHeight: undefined
    }
  }
};
