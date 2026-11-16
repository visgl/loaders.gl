// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// LASER (LAS) FILE FORMAT
import type {Loader} from '@loaders.gl/core/loader-utils';
import type {Table, RecordBatch} from 'apache-arrow';
import {LAS_LOADER_METADATA, type LASLoaderOptions} from '../../../../modules/pointclouds/src/las/las-loader-shared';
import type {LASMesh} from '../../../../modules/pointclouds/src/las/lib/las-types';

/**
 * Metadata-only loader for the LAS (LASer) point cloud format.
 * @note Does not support LAS v1.4
 */
export const LAZPerfLoader = {
  ...LAS_LOADER_METADATA,
  name: 'LAS (laz-perf)',
  preload: async () => {
    const {LAZPerfLoaderWithParser} = await import('./lazperf-loader');
    return LAZPerfLoaderWithParser;
  }
} as const satisfies Loader<LASMesh | Table, LASMesh | RecordBatch, LASLoaderOptions>;
