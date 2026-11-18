// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ARCGIS_IMAGE_TILE_SOURCE_LOADER_METADATA} from '../arcgis-source-types';
import type {CoreAPI, SourceLoader} from '@loaders.gl/core/loader-utils';
import type {ArcGISImageTileSource} from './arcgis-image-tile-loader';
import type {ArcGISImageTileLoaderOptions} from '../arcgis-source-types';

/** Loads the ArcGISImageTileLoader implementation on first asynchronous use. */
async function preloadArcGISImageTileSourceLoader(): Promise<SourceLoader<ArcGISImageTileSource>> {
  const {ArcGISImageTileLoaderWithParser} = await import(
    '@loaders.gl/arcgis/arcgis-image-tile-loader'
  );
  return ArcGISImageTileLoaderWithParser;
}

/** Lightweight service descriptor; use createDataSource() or the synchronous /bundled entrypoint. */
export const ArcGISImageTileLoader = {
  ...ARCGIS_IMAGE_TILE_SOURCE_LOADER_METADATA,
  dataType: null as unknown as ArcGISImageTileSource,
  batchType: null as never,
  preload: preloadArcGISImageTileSourceLoader,
  /** Requires the runtime loader when constructing a source synchronously. */
  createDataSourceSync(
    _url: string,
    _options: ArcGISImageTileLoaderOptions,
    _coreApi?: CoreAPI
  ): ArcGISImageTileSource {
    throw new Error(
      'ArcGISImageTileLoader requires async createDataSource() or an @loaders.gl/arcgis/bundled import'
    );
  }
} as const satisfies SourceLoader<ArcGISImageTileSource>;
