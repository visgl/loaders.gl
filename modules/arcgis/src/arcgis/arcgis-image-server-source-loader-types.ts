// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ARCGIS_IMAGE_SERVER_SOURCE_LOADER_METADATA} from '../arcgis-source-types';
import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import type {ArcGISImageSource} from './arcgis-image-server-source-loader';
import type {ArcGISImageSourceLoaderProps} from '../arcgis-source-types';

/** Loads the ArcGISImageServerSourceLoader implementation on first asynchronous use. */
async function preloadArcGISImageServerSourceLoader(): Promise<SourceLoader<ArcGISImageSource>> {
  const {ArcGISImageServerSourceLoaderWithParser} = await import(
    '@loaders.gl/arcgis/arcgis-image-server-source-loader'
  );
  return ArcGISImageServerSourceLoaderWithParser;
}

/** Lightweight service descriptor; use load() or the synchronous /bundled entrypoint. */
export const ArcGISImageServerSourceLoader = {
  ...ARCGIS_IMAGE_SERVER_SOURCE_LOADER_METADATA,
  dataType: null as unknown as ArcGISImageSource,
  batchType: null as never,
  preload: preloadArcGISImageServerSourceLoader,
  /** Requires the runtime loader when constructing a source synchronously. */
  createDataSource(
    _url: string,
    _options: ArcGISImageSourceLoaderProps,
    _coreApi?: CoreAPI
  ): ArcGISImageSource {
    throw new Error(
      'ArcGISImageServerSourceLoader requires async load() or an @loaders.gl/arcgis/bundled import'
    );
  }
} as const satisfies SourceLoader<ArcGISImageSource>;
