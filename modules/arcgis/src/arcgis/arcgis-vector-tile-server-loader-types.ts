// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ARCGIS_VECTOR_TILE_SERVER_SOURCE_LOADER_METADATA} from '../arcgis-source-types';
import type {CoreAPI, SourceLoader} from '@loaders.gl/core/loader-utils';
import type {ArcGISVectorTileServerSource} from './arcgis-vector-tile-server-loader';
import type {ArcGISVectorTileServerLoaderOptions} from '../arcgis-source-types';

/** Loads the ArcGISVectorTileServerLoader implementation on first asynchronous use. */
async function preloadArcGISVectorTileServerSourceLoader(): Promise<
  SourceLoader<ArcGISVectorTileServerSource>
> {
  const {ArcGISVectorTileServerLoaderWithParser} = await import(
    '@loaders.gl/arcgis/arcgis-vector-tile-server-loader'
  );
  return ArcGISVectorTileServerLoaderWithParser;
}

/** Lightweight service descriptor; use createDataSource() or the synchronous /bundled entrypoint. */
export const ArcGISVectorTileServerLoader = {
  ...ARCGIS_VECTOR_TILE_SERVER_SOURCE_LOADER_METADATA,
  dataType: null as unknown as ArcGISVectorTileServerSource,
  batchType: null as never,
  preload: preloadArcGISVectorTileServerSourceLoader,
  /** Requires the runtime loader when constructing a source synchronously. */
  createDataSourceSync(
    _url: string,
    _options: ArcGISVectorTileServerLoaderOptions,
    _coreApi?: CoreAPI
  ): ArcGISVectorTileServerSource {
    throw new Error(
      'ArcGISVectorTileServerLoader requires async createDataSource() or an @loaders.gl/arcgis/bundled import'
    );
  }
} as const satisfies SourceLoader<ArcGISVectorTileServerSource>;
