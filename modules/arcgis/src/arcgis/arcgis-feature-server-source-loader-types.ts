// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ARCGIS_FEATURE_SERVER_SOURCE_LOADER_METADATA} from '../arcgis-source-types';
import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import type {ArcGISVectorSource} from './arcgis-feature-server-source-loader';
import type {ArcGISFeatureServerSourceLoaderOptions} from '../arcgis-source-types';

/** Loads the ArcGISFeatureServerSourceLoader implementation on first asynchronous use. */
async function preloadArcGISFeatureServerSourceLoader(): Promise<SourceLoader<ArcGISVectorSource>> {
  const {ArcGISFeatureServerSourceLoaderWithParser} = await import(
    '@loaders.gl/arcgis/arcgis-feature-server-source-loader'
  );
  return ArcGISFeatureServerSourceLoaderWithParser;
}

/** Lightweight service descriptor; use load() or the synchronous /bundled entrypoint. */
export const ArcGISFeatureServerSourceLoader = {
  ...ARCGIS_FEATURE_SERVER_SOURCE_LOADER_METADATA,
  dataType: null as unknown as ArcGISVectorSource,
  batchType: null as never,
  preload: preloadArcGISFeatureServerSourceLoader,
  /** Requires the runtime loader when constructing a source synchronously. */
  createDataSource(
    _url: string,
    _options: ArcGISFeatureServerSourceLoaderOptions,
    _coreApi?: CoreAPI
  ): ArcGISVectorSource {
    throw new Error(
      'ArcGISFeatureServerSourceLoader requires async load() or an @loaders.gl/arcgis/bundled import'
    );
  }
} as const satisfies SourceLoader<ArcGISVectorSource>;
