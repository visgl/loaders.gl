// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {TerrainLoader, type TerrainLoaderOptions} from './terrain-loader';

/**
 * Metadata-only loader for height-map terrain meshes as Apache Arrow tables.
 */
export const TerrainArrowLoader = {
  ...TerrainLoader,
  dataType: null as unknown as MeshArrowTable,
  batchType: null as never,
  worker: false,
  /** Loads the parser-bearing terrain Arrow loader implementation. */
  preload: async () =>
    (await import('./terrain-arrow-loader-with-parser')).TerrainArrowLoaderWithParser
} as const satisfies Loader<MeshArrowTable, never, TerrainLoaderOptions>;
