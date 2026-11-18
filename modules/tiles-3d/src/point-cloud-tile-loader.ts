// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/core/loader-utils';
import {PointCloudTileSource} from '@loaders.gl/tiles-3d/point-cloud-tile-source';
import {PointCloudTileLoader} from './point-cloud-tile-loader-types';
import type {
  PointCloudTileSourceInput,
  PointCloudTileLoaderOptions
} from './point-cloud-tile-source-types';

const {
  preload: _preload,
  createDataSourceSync: _createDataSource,
  ...metadata
} = PointCloudTileLoader;

/** Parser-bearing source factory for decoded point Mesh/Arrow data. */
export const PointCloudTileLoaderWithParser = {
  ...metadata,
  /** Creates a native-coordinate source with deferred child indexing. */
  createDataSourceSync(
    input: PointCloudTileSourceInput | string | Blob,
    options: PointCloudTileLoaderOptions = {},
    coreApi?: CoreAPI
  ): PointCloudTileSource {
    if (typeof input === 'string' || input instanceof Blob)
      throw new Error('PointCloudTileLoader requires decoded Mesh/Arrow input');
    return new PointCloudTileSource(input, options, coreApi);
  }
} as const satisfies SourceLoader<PointCloudTileSource>;
