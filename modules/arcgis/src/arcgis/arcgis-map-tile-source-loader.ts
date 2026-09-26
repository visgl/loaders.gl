// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import {ArcGISMapTileSourceLoader} from './arcgis-map-tile-source-loader-types';
import {ArcGISMapTileSource} from './arcgis-map-tile-source';
import type {ArcGISMapTileSourceLoaderOptions} from './arcgis-map-tile-source-options';

const {preload: _preload, ...metadata} = ArcGISMapTileSourceLoader;

/** Runtime ArcGIS loader for explicit, synchronous source construction. */
export const ArcGISMapTileSourceLoaderWithParser = {
  ...metadata,
  createDataSource: (
    url: string,
    options: ArcGISMapTileSourceLoaderOptions = {},
    coreApi?: CoreAPI
  ) => new ArcGISMapTileSource(url, options, coreApi)
} as const satisfies SourceLoader<ArcGISMapTileSource>;
