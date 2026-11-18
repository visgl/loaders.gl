// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ARCGIS_MAP_TILE_SOURCE_LOADER_METADATA} from '../arcgis-source-types';
import type {CoreAPI, SourceLoader} from '@loaders.gl/core/loader-utils';
import type {ArcGISMapTileSource} from './arcgis-map-tile-loader';
import type {ArcGISMapTileLoaderOptions} from '../arcgis-source-types';

/** Loads the ArcGISMapTileLoader implementation on first asynchronous use. */
async function preloadArcGISMapTileSourceLoader(): Promise<SourceLoader<ArcGISMapTileSource>> {
  const {ArcGISMapTileLoaderWithParser} = await import('@loaders.gl/arcgis/arcgis-map-tile-loader');
  return ArcGISMapTileLoaderWithParser;
}

/** Lightweight service descriptor; use createDataSource() or the synchronous /bundled entrypoint. */
export const ArcGISMapTileLoader = {
  ...ARCGIS_MAP_TILE_SOURCE_LOADER_METADATA,
  dataType: null as unknown as ArcGISMapTileSource,
  batchType: null as never,
  preload: preloadArcGISMapTileSourceLoader,
  /** Requires the runtime loader when constructing a source synchronously. */
  createDataSourceSync(
    _url: string,
    _options: ArcGISMapTileLoaderOptions,
    _coreApi?: CoreAPI
  ): ArcGISMapTileSource {
    throw new Error(
      'ArcGISMapTileLoader requires async createDataSource() or an @loaders.gl/arcgis/bundled import'
    );
  }
} as const satisfies SourceLoader<ArcGISMapTileSource>;
