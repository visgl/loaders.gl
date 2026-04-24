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
 * @note Does not support LAS v1.4
 */
export const LAZPerfLoader = {
  ...LASWorkerLoader,
  preload: async () => {
    const {LAZPerfLoaderWithParser} = await import('./lazperf-loader-with-parser');
    return LAZPerfLoaderWithParser;
  }
} as const satisfies Loader<LASMesh, never, LASLoaderOptions>;
