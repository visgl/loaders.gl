// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {Mesh} from '@loaders.gl/schema';
import type {ImageBitmapLoaderOptions} from '@loaders.gl/images';
import {VERSION} from './lib/utils/version';

import type {TerrainOptions} from './lib/parse-terrain';
import {TerrainFormat} from './terrain-format';

/** TerrainLoader options */
export type TerrainLoaderOptions = ImageBitmapLoaderOptions & {
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

  ...TerrainFormat,
  version: VERSION,
  worker: true,
  /** Loads the parser-bearing terrain loader implementation. */
  preload: async () => (await import('./terrain-loader-with-parser')).TerrainLoaderWithParser,
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
