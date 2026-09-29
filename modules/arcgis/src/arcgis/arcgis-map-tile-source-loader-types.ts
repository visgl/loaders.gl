// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ARCGIS_MAP_TILE_SOURCE_LOADER_METADATA} from '../arcgis-source-types';
import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import type {ArcGISMapTileSource} from './arcgis-map-tile-source-loader';
import type {ArcGISMapTileSourceLoaderOptions} from '../arcgis-source-types';

/** Loads the ArcGISMapTileSourceLoader implementation on first asynchronous use. */
async function preloadArcGISMapTileSourceLoader(): Promise<SourceLoader<ArcGISMapTileSource>> {
  const {ArcGISMapTileSourceLoaderWithParser} = await import(
    '@loaders.gl/arcgis/arcgis-map-tile-source-loader'
  );
  return ArcGISMapTileSourceLoaderWithParser;
}

/** Lightweight service descriptor; use load() or the synchronous /bundled entrypoint. */
export const ArcGISMapTileSourceLoader = {
  ...ARCGIS_MAP_TILE_SOURCE_LOADER_METADATA,
  dataType: null as unknown as ArcGISMapTileSource,
  batchType: null as never,
  preload: preloadArcGISMapTileSourceLoader,
  /** Requires the runtime loader when constructing a source synchronously. */
  createDataSource(
    _url: string,
    _options: ArcGISMapTileSourceLoaderOptions,
    _coreApi?: CoreAPI
  ): ArcGISMapTileSource {
    throw new Error(
      'ArcGISMapTileSourceLoader requires async load() or an @loaders.gl/arcgis/bundled import'
    );
  }
} as const satisfies SourceLoader<ArcGISMapTileSource>;
