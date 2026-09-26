// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import type {ArcGISVectorTileServerSource} from './arcgis-vector-tile-server-source';
import type {ArcGISVectorTileServerSourceLoaderOptions} from './arcgis-vector-tile-server-source-options';
import {ARCGIS_VECTOR_TILE_SERVER_SOURCE_DEFAULT_OPTIONS} from './arcgis-vector-tile-server-source-options';
import {ArcGISAuthentication} from '../authentication';

// __VERSION__ is injected by the package build.
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Loads the ArcGIS runtime from its explicit package entry point. */
async function preloadArcGISVectorTileServerSourceLoader(): Promise<
  SourceLoader<ArcGISVectorTileServerSource>
> {
  const {ArcGISVectorTileServerSourceLoaderWithParser} = await import(
    '@loaders.gl/arcgis/arcgis-vector-tile-server-source-loader'
  );
  return ArcGISVectorTileServerSourceLoaderWithParser;
}

/** Lightweight ArcGIS service metadata for asynchronous load() and SourceLayer. */
export const ArcGISVectorTileServerSourceLoader = {
  dataType: null as unknown as ArcGISVectorTileServerSource,
  batchType: null as never,
  name: 'ArcGIS VectorTileServer',
  id: 'arcgis-vector-tile-server',
  module: 'arcgis',
  version: VERSION,
  /** Supplies the ArcGIS constructor for declarative service credentials. */
  getAuthentications: () => [ArcGISAuthentication],
  extensions: [],
  mimeTypes: ['application/vnd.mapbox-vector-tile', 'application/x-protobuf'],
  type: 'arcgis-vector-tile-server',
  fromUrl: true,
  fromBlob: false,
  testURL: (url: string): boolean => /\/vectortileserver(?:[\/?#]|$)/i.test(url),
  options: ARCGIS_VECTOR_TILE_SERVER_SOURCE_DEFAULT_OPTIONS,
  defaultOptions: ARCGIS_VECTOR_TILE_SERVER_SOURCE_DEFAULT_OPTIONS,
  preload: preloadArcGISVectorTileServerSourceLoader,
  /** Requires the runtime loader for synchronous source construction. */
  createDataSource: (
    url: string,
    options: ArcGISVectorTileServerSourceLoaderOptions = {},
    coreApi?: CoreAPI
  ) => {
    throw new Error(
      'ArcGISVectorTileServerSourceLoader requires async load() or an explicit @loaders.gl/arcgis/arcgis-vector-tile-server-source-loader import'
    );
  }
} as const satisfies SourceLoader<ArcGISVectorTileServerSource>;
