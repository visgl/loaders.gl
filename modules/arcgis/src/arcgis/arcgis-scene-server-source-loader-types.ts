// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import type {ArcGISSceneServerSource} from './arcgis-scene-server-source';
import type {ArcGISSceneServerSourceOptions} from './arcgis-scene-server-source-options';
import {ARCGIS_SCENE_SERVER_SOURCE_DEFAULT_OPTIONS} from './arcgis-scene-server-source-options';
import {ArcGISAuthentication} from '../authentication';

// __VERSION__ is injected by the package build.
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Loads the ArcGIS runtime from its explicit package entry point. */
async function preloadArcGISSceneServerSourceLoader(): Promise<
  SourceLoader<ArcGISSceneServerSource>
> {
  const {ArcGISSceneServerSourceLoaderWithParser} = await import(
    '@loaders.gl/arcgis/arcgis-scene-server-source-loader'
  );
  return ArcGISSceneServerSourceLoaderWithParser;
}

/** Lightweight ArcGIS service metadata for asynchronous load() and SourceLayer. */
export const ArcGISSceneServerSourceLoader = {
  dataType: null as unknown as ArcGISSceneServerSource,
  batchType: null as never,
  name: 'ArcGIS SceneServer',
  id: 'arcgis-scene-server',
  module: 'arcgis',
  version: VERSION,
  /** Supplies the ArcGIS constructor for declarative service credentials. */
  getAuthentications: () => [ArcGISAuthentication],
  extensions: [],
  mimeTypes: ['application/json'],
  type: 'arcgis-scene-server',
  fromUrl: true,
  fromBlob: false,
  testURL: (url: string): boolean => /\/SceneServer(?:[\/?#]|$)/i.test(url),
  options: ARCGIS_SCENE_SERVER_SOURCE_DEFAULT_OPTIONS,
  defaultOptions: ARCGIS_SCENE_SERVER_SOURCE_DEFAULT_OPTIONS,
  preload: preloadArcGISSceneServerSourceLoader,
  /** Requires the runtime loader for synchronous source construction. */
  createDataSource: (
    url: string,
    options: ArcGISSceneServerSourceOptions = {},
    coreApi?: CoreAPI
  ) => {
    throw new Error(
      'ArcGISSceneServerSourceLoader requires async load() or an explicit @loaders.gl/arcgis/arcgis-scene-server-source-loader import'
    );
  }
} as const satisfies SourceLoader<ArcGISSceneServerSource>;
