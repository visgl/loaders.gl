// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {ImageLoaderOptions} from '@loaders.gl/images';
import {VERSION} from './lib/utils/version';

import {TerrainOptions} from './lib/parse-terrain';
import {Mesh} from '@loaders.gl/schema';

/** TerrainLoader options */
export type TerrainLoaderOptions = ImageLoaderOptions & {
  /** TerrainLoader options */
  terrain?: TerrainOptions & {
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * Worker loader for image encoded terrain
 */
export const TerrainLoader = {
  dataType: null as unknown as Mesh,
  batchType: null as never,

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
} as const satisfies Loader<Mesh, never, TerrainLoaderOptions>;
