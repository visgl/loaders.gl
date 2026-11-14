// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/core/loader-utils';
import type {Table} from 'apache-arrow';
import type {Mesh} from '@loaders.gl/core/schema';
import type {ImageLoaderOptions} from '@loaders.gl/images';
import {VERSION} from './lib/utils/version';

import type {TerrainOptions} from './lib/parse-terrain';
import {TerrainFormat} from './terrain-format';

/** TerrainLoader options */
export type TerrainLoaderOptions = ImageLoaderOptions & {
  /** TerrainLoader options */
  terrain?: TerrainOptions & {
    /** Selects mesh output or Apache Arrow output. */
    shape?: 'mesh' | 'arrow';
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * Worker loader for image encoded terrain
 */
export const TerrainLoader = {
  defaultShape: 'arrow',
  supportsNativeArrow: true,
  dataType: null as unknown as Mesh | Table,
  batchType: null as never,

  ...TerrainFormat,
  version: VERSION,
  worker: true,
  /** Loads the parser-bearing terrain loader implementation. */
  preload: async () => (await import('@loaders.gl/raster/terrain-loader')).TerrainLoaderWithParser,
  options: {
    terrain: {
      tesselator: 'auto',
      shape: 'arrow',
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
} as const satisfies Loader<Mesh | Table, never, TerrainLoaderOptions>;
