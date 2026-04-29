// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// LASER (LAS) FILE FORMAT
import type {Loader} from '@loaders.gl/loader-utils';
import type {LASLoaderOptions} from './las-loader';
import {LASWorkerLoader} from './las-loader';
import type {LASMesh} from './lib/las-types';

/**
 * Metadata-only loader for the LAS (LASer) point cloud format.
 */
export const LAZRsLoader = {
  ...LASWorkerLoader,
  preload: async () => {
    const {LAZRsLoaderWithParser} = await import('./laz-rs-loader-with-parser');
    return LAZRsLoaderWithParser;
  }
} as const satisfies Loader<LASMesh, never, LASLoaderOptions>;
