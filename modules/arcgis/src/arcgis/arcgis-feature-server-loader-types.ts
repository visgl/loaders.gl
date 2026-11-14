// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ARCGIS_FEATURE_SERVER_SOURCE_LOADER_METADATA} from '../arcgis-source-types';
import type {CoreAPI, SourceLoader} from '@loaders.gl/core/loader-utils';
import type {ArcGISVectorSource} from './arcgis-feature-server-loader';
import type {ArcGISFeatureServerLoaderOptions} from '../arcgis-source-types';

/** Loads the ArcGISFeatureServerLoader implementation on first asynchronous use. */
async function preloadArcGISFeatureServerSourceLoader(): Promise<SourceLoader<ArcGISVectorSource>> {
  const {ArcGISFeatureServerLoaderWithParser} = await import(
    '@loaders.gl/arcgis/arcgis-feature-server-loader'
  );
  return ArcGISFeatureServerLoaderWithParser;
}

/** Lightweight service descriptor; use createDataSource() or the synchronous /bundled entrypoint. */
export const ArcGISFeatureServerLoader = {
  ...ARCGIS_FEATURE_SERVER_SOURCE_LOADER_METADATA,
  dataType: null as unknown as ArcGISVectorSource,
  batchType: null as never,
  preload: preloadArcGISFeatureServerSourceLoader,
  /** Requires the runtime loader when constructing a source synchronously. */
  createDataSourceSync(
    _url: string,
    _options: ArcGISFeatureServerLoaderOptions,
    _coreApi?: CoreAPI
  ): ArcGISVectorSource {
    throw new Error(
      'ArcGISFeatureServerLoader requires async createDataSource() or an @loaders.gl/arcgis/bundled import'
    );
  }
} as const satisfies SourceLoader<ArcGISVectorSource>;
