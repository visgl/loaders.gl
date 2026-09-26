// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import type {ArcGISMapTileSource} from './arcgis-map-tile-source';
import type {ArcGISMapTileSourceLoaderOptions} from './arcgis-map-tile-source-options';
import {ARCGIS_MAP_TILE_SOURCE_DEFAULT_OPTIONS} from './arcgis-map-tile-source-options';
import {ArcGISAuthentication} from '../authentication';

// __VERSION__ is injected by the package build.
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Loads the ArcGIS runtime from its explicit package entry point. */
async function preloadArcGISMapTileSourceLoader(): Promise<SourceLoader<ArcGISMapTileSource>> {
  const {ArcGISMapTileSourceLoaderWithParser} = await import(
    '@loaders.gl/arcgis/arcgis-map-tile-source-loader'
  );
  return ArcGISMapTileSourceLoaderWithParser;
}

/** Lightweight ArcGIS service metadata for asynchronous load() and SourceLayer. */
export const ArcGISMapTileSourceLoader = {
  dataType: null as unknown as ArcGISMapTileSource,
  batchType: null as never,
  name: 'ArcGIS MapServer tiles',
  id: 'arcgis-map-server',
  module: 'arcgis',
  version: VERSION,
  /** Supplies the ArcGIS constructor for declarative service credentials. */
  getAuthentications: () => [ArcGISAuthentication],
  extensions: [],
  mimeTypes: [],
  type: 'arcgis-map-server',
  fromUrl: true,
  fromBlob: false,
  testURL: (url: string): boolean =>
    /mapserver/i.test(url) && !/imageserver|featureserver/i.test(url),
  options: ARCGIS_MAP_TILE_SOURCE_DEFAULT_OPTIONS,
  defaultOptions: ARCGIS_MAP_TILE_SOURCE_DEFAULT_OPTIONS,
  preload: preloadArcGISMapTileSourceLoader,
  /** Requires the runtime loader for synchronous source construction. */
  createDataSource: (
    url: string,
    options: ArcGISMapTileSourceLoaderOptions = {},
    coreApi?: CoreAPI
  ) => {
    throw new Error(
      'ArcGISMapTileSourceLoader requires async load() or an explicit @loaders.gl/arcgis/arcgis-map-tile-source-loader import'
    );
  }
} as const satisfies SourceLoader<ArcGISMapTileSource>;
