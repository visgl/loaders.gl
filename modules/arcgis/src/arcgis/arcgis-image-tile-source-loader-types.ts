// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import type {ArcGISImageTileSource} from './arcgis-image-tile-source';
import type {ArcGISImageTileSourceLoaderOptions} from './arcgis-image-tile-source-options';
import {ARCGIS_IMAGE_TILE_SOURCE_DEFAULT_OPTIONS} from './arcgis-image-tile-source-options';
import {ArcGISAuthentication} from '../authentication';

// __VERSION__ is injected by the package build.
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Loads the ArcGIS runtime from its explicit package entry point. */
async function preloadArcGISImageTileSourceLoader(): Promise<SourceLoader<ArcGISImageTileSource>> {
  const {ArcGISImageTileSourceLoaderWithParser} = await import(
    '@loaders.gl/arcgis/arcgis-image-tile-source-loader'
  );
  return ArcGISImageTileSourceLoaderWithParser;
}

/** Lightweight ArcGIS service metadata for asynchronous load() and SourceLayer. */
export const ArcGISImageTileSourceLoader = {
  dataType: null as unknown as ArcGISImageTileSource,
  batchType: null as never,
  name: 'ArcGIS ImageServer tiles',
  id: 'arcgis-image-server-tiles',
  module: 'arcgis',
  version: VERSION,
  /** Supplies the ArcGIS constructor for declarative service credentials. */
  getAuthentications: () => [ArcGISAuthentication],
  extensions: [],
  mimeTypes: [],
  type: 'arcgis-image-server-tiles',
  fromUrl: true,
  fromBlob: false,
  testURL: (url: string): boolean => /imageserver/i.test(url),
  options: ARCGIS_IMAGE_TILE_SOURCE_DEFAULT_OPTIONS,
  defaultOptions: ARCGIS_IMAGE_TILE_SOURCE_DEFAULT_OPTIONS,
  preload: preloadArcGISImageTileSourceLoader,
  /** Requires the runtime loader for synchronous source construction. */
  createDataSource: (
    url: string,
    options: ArcGISImageTileSourceLoaderOptions = {},
    coreApi?: CoreAPI
  ) => {
    throw new Error(
      'ArcGISImageTileSourceLoader requires async load() or an explicit @loaders.gl/arcgis/arcgis-image-tile-source-loader import'
    );
  }
} as const satisfies SourceLoader<ArcGISImageTileSource>;
