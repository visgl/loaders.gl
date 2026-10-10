// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import {PointCloudTileSource} from '@loaders.gl/tiles/point-cloud-tile-source';
import {PointCloudTileSourceLoader} from './point-cloud-tile-source-loader-types';
import type {
  PointCloudTileSourceInput,
  PointCloudTileSourceOptions
} from './point-cloud-tile-source-types';

const {
  preload: _preload,
  createDataSource: _createDataSource,
  ...metadata
} = PointCloudTileSourceLoader;

/** Parser-bearing source factory for decoded point Mesh/Arrow data. */
export const PointCloudTileSourceLoaderWithParser = {
  ...metadata,
  /** Creates a native-coordinate source with deferred child indexing. */
  createDataSource(
    input: PointCloudTileSourceInput | string | Blob,
    options: PointCloudTileSourceOptions = {},
    coreApi?: CoreAPI
  ): PointCloudTileSource {
    if (typeof input === 'string' || input instanceof Blob)
      throw new Error('PointCloudTileSourceLoader requires decoded Mesh/Arrow input');
    return new PointCloudTileSource(input, options, coreApi);
  }
} as const satisfies SourceLoader<PointCloudTileSource>;
