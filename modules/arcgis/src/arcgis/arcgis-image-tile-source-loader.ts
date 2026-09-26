// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import {ArcGISImageTileSourceLoader} from './arcgis-image-tile-source-loader-types';
import {ArcGISImageTileSource} from './arcgis-image-tile-source';
import type {ArcGISImageTileSourceLoaderOptions} from './arcgis-image-tile-source-options';

const {preload: _preload, ...metadata} = ArcGISImageTileSourceLoader;

/** Runtime ArcGIS loader for explicit, synchronous source construction. */
export const ArcGISImageTileSourceLoaderWithParser = {
  ...metadata,
  createDataSource: (
    url: string,
    options: ArcGISImageTileSourceLoaderOptions = {},
    coreApi?: CoreAPI
  ) => new ArcGISImageTileSource(url, options, coreApi)
} as const satisfies SourceLoader<ArcGISImageTileSource>;
