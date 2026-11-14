// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// LASER (LAS) FILE FORMAT
import type {Loader} from '@loaders.gl/core/loader-utils';
import type {Table, RecordBatch} from 'apache-arrow';
import {LAS_LOADER_METADATA, type LASLoaderOptions} from './las-loader-shared';
import type {LASMesh} from './lib/las-types';

/**
 * Metadata-only loader for the LAS (LASer) point cloud format.
 */
export const LAZRsLoader = {
  ...LAS_LOADER_METADATA,
  name: 'LAS (laz-rs)',
  preload: async () => {
    const {LAZRsLoaderWithParser} = await import('@loaders.gl/pointclouds/laz-rs-loader');
    return LAZRsLoaderWithParser;
  }
} as const satisfies Loader<LASMesh | Table, LASMesh | RecordBatch, LASLoaderOptions>;
