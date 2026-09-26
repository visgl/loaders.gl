// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import {ArcGISSceneServerSourceLoader} from './arcgis-scene-server-source-loader-types';
import {ArcGISSceneServerSource} from './arcgis-scene-server-source';
import type {ArcGISSceneServerSourceOptions} from './arcgis-scene-server-source-options';

const {preload: _preload, ...metadata} = ArcGISSceneServerSourceLoader;

/** Runtime ArcGIS loader for explicit, synchronous source construction. */
export const ArcGISSceneServerSourceLoaderWithParser = {
  ...metadata,
  createDataSource: (
    url: string,
    options: ArcGISSceneServerSourceOptions = {},
    coreApi?: CoreAPI
  ) => new ArcGISSceneServerSource(url, options, coreApi)
} as const satisfies SourceLoader<ArcGISSceneServerSource>;
