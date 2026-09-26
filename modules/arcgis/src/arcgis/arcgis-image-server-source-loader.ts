// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import {ArcGISImageServerSourceLoader} from './arcgis-image-server-source-loader-types';
import {ArcGISImageSource} from './arcgis-image-server-source';
import type {ArcGISImageSourceLoaderProps} from './arcgis-image-server-source-options';

const {preload: _preload, ...metadata} = ArcGISImageServerSourceLoader;

/** Runtime ArcGIS loader for explicit, synchronous source construction. */
export const ArcGISImageServerSourceLoaderWithParser = {
  ...metadata,
  createDataSource: (
    url: string,
    props: ArcGISImageSourceLoaderProps,
    coreApi?: CoreAPI
  ): ArcGISImageSource => new ArcGISImageSource(url, props, coreApi)
} as const satisfies SourceLoader<ArcGISImageSource>;
