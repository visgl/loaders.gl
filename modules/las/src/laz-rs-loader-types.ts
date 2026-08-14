// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// LASER (LAS) FILE FORMAT
import type {Loader} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {LAS_LOADER_METADATA, type LASLoaderOptions} from './las-loader-shared';
import type {LASMesh} from './lib/las-types';

/**
 * Metadata-only loader for the LAS (LASer) point cloud format.
 */
export const LAZRsLoader = {
  ...LAS_LOADER_METADATA,
  name: 'LAS (laz-rs)',
  preload: async () => {
    const {LAZRsLoaderWithParser} = await import('@loaders.gl/las/laz-rs-loader');
    return LAZRsLoaderWithParser;
  }
} as const satisfies Loader<LASMesh | MeshArrowTable, LASMesh | MeshArrowTable, LASLoaderOptions>;
