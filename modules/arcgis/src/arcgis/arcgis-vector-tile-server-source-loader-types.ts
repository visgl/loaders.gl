// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ARCGIS_VECTOR_TILE_SERVER_SOURCE_LOADER_METADATA} from '../arcgis-source-types';
import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import type {ArcGISVectorTileServerSource} from './arcgis-vector-tile-server-source-loader';
import type {ArcGISVectorTileServerSourceLoaderOptions} from '../arcgis-source-types';

/** Loads the ArcGISVectorTileServerSourceLoader implementation on first asynchronous use. */
async function preloadArcGISVectorTileServerSourceLoader(): Promise<
  SourceLoader<ArcGISVectorTileServerSource>
> {
  const {ArcGISVectorTileServerSourceLoaderWithParser} = await import(
    '@loaders.gl/arcgis/arcgis-vector-tile-server-source-loader'
  );
  return ArcGISVectorTileServerSourceLoaderWithParser;
}

/** Lightweight service descriptor; use load() or the synchronous /bundled entrypoint. */
export const ArcGISVectorTileServerSourceLoader = {
  ...ARCGIS_VECTOR_TILE_SERVER_SOURCE_LOADER_METADATA,
  dataType: null as unknown as ArcGISVectorTileServerSource,
  batchType: null as never,
  preload: preloadArcGISVectorTileServerSourceLoader,
  /** Requires the runtime loader when constructing a source synchronously. */
  createDataSource(
    _url: string,
    _options: ArcGISVectorTileServerSourceLoaderOptions,
    _coreApi?: CoreAPI
  ): ArcGISVectorTileServerSource {
    throw new Error(
      'ArcGISVectorTileServerSourceLoader requires async load() or an @loaders.gl/arcgis/bundled import'
    );
  }
} as const satisfies SourceLoader<ArcGISVectorTileServerSource>;
