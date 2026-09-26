// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import {ArcGISVectorTileServerSourceLoader} from './arcgis-vector-tile-server-source-loader-types';
import {ArcGISVectorTileServerSource} from './arcgis-vector-tile-server-source';
import type {ArcGISVectorTileServerSourceLoaderOptions} from './arcgis-vector-tile-server-source-options';

const {preload: _preload, ...metadata} = ArcGISVectorTileServerSourceLoader;

/** Runtime ArcGIS loader for explicit, synchronous source construction. */
export const ArcGISVectorTileServerSourceLoaderWithParser = {
  ...metadata,
  createDataSource: (
    url: string,
    options: ArcGISVectorTileServerSourceLoaderOptions = {},
    coreApi?: CoreAPI
  ) => new ArcGISVectorTileServerSource(url, options, coreApi)
} as const satisfies SourceLoader<ArcGISVectorTileServerSource>;
