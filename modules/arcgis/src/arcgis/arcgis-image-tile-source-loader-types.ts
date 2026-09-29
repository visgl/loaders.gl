// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ARCGIS_IMAGE_TILE_SOURCE_LOADER_METADATA} from '../arcgis-source-types';
import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import type {ArcGISImageTileSource} from './arcgis-image-tile-source-loader';
import type {ArcGISImageTileSourceLoaderOptions} from '../arcgis-source-types';

/** Loads the ArcGISImageTileSourceLoader implementation on first asynchronous use. */
async function preloadArcGISImageTileSourceLoader(): Promise<SourceLoader<ArcGISImageTileSource>> {
  const {ArcGISImageTileSourceLoaderWithParser} = await import(
    '@loaders.gl/arcgis/arcgis-image-tile-source-loader'
  );
  return ArcGISImageTileSourceLoaderWithParser;
}

/** Lightweight service descriptor; use load() or the synchronous /bundled entrypoint. */
export const ArcGISImageTileSourceLoader = {
  ...ARCGIS_IMAGE_TILE_SOURCE_LOADER_METADATA,
  dataType: null as unknown as ArcGISImageTileSource,
  batchType: null as never,
  preload: preloadArcGISImageTileSourceLoader,
  /** Requires the runtime loader when constructing a source synchronously. */
  createDataSource(
    _url: string,
    _options: ArcGISImageTileSourceLoaderOptions,
    _coreApi?: CoreAPI
  ): ArcGISImageTileSource {
    throw new Error(
      'ArcGISImageTileSourceLoader requires async load() or an @loaders.gl/arcgis/bundled import'
    );
  }
} as const satisfies SourceLoader<ArcGISImageTileSource>;
