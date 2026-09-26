// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import {ArcGISFeatureServerSourceLoader} from './arcgis-feature-server-source-loader-types';
import {ArcGISVectorSource} from './arcgis-feature-server-source';
import type {ArcGISFeatureServerSourceLoaderOptions} from './arcgis-feature-server-source-options';

const {preload: _preload, ...metadata} = ArcGISFeatureServerSourceLoader;

/** Runtime ArcGIS loader for explicit, synchronous source construction. */
export const ArcGISFeatureServerSourceLoaderWithParser = {
  ...metadata,
  createDataSource: (
    url: string,
    options: ArcGISFeatureServerSourceLoaderOptions,
    coreApi?: CoreAPI
  ): ArcGISVectorSource => new ArcGISVectorSource(url, options, coreApi)
} as const satisfies SourceLoader<ArcGISVectorSource>;
