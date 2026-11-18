// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ARCGIS_IMAGE_SERVER_SOURCE_LOADER_METADATA} from '../arcgis-source-types';
import type {CoreAPI, SourceLoader} from '@loaders.gl/core/loader-utils';
import type {ArcGISImageSource} from './arcgis-image-server-loader';
import type {ArcGISImageServerLoaderOptions} from '../arcgis-source-types';

/** Loads the ArcGISImageServerLoader implementation on first asynchronous use. */
async function preloadArcGISImageServerSourceLoader(): Promise<SourceLoader<ArcGISImageSource>> {
  const {ArcGISImageServerLoaderWithParser} = await import(
    '@loaders.gl/arcgis/arcgis-image-server-loader'
  );
  return ArcGISImageServerLoaderWithParser;
}

/** Lightweight service descriptor; use createDataSource() or the synchronous /bundled entrypoint. */
export const ArcGISImageServerLoader = {
  ...ARCGIS_IMAGE_SERVER_SOURCE_LOADER_METADATA,
  dataType: null as unknown as ArcGISImageSource,
  batchType: null as never,
  preload: preloadArcGISImageServerSourceLoader,
  /** Requires the runtime loader when constructing a source synchronously. */
  createDataSourceSync(
    _url: string,
    _options: ArcGISImageServerLoaderOptions,
    _coreApi?: CoreAPI
  ): ArcGISImageSource {
    throw new Error(
      'ArcGISImageServerLoader requires async createDataSource() or an @loaders.gl/arcgis/bundled import'
    );
  }
} as const satisfies SourceLoader<ArcGISImageSource>;
