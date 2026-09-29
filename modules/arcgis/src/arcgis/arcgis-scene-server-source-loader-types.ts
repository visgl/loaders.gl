// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ARCGIS_SCENE_SERVER_SOURCE_LOADER_METADATA} from '../arcgis-source-types';
import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import type {ArcGISSceneServerSource} from './arcgis-scene-server-source-loader';
import type {ArcGISSceneServerSourceOptions} from '../arcgis-source-types';

/** Loads the ArcGISSceneServerSourceLoader implementation on first asynchronous use. */
async function preloadArcGISSceneServerSourceLoader(): Promise<
  SourceLoader<ArcGISSceneServerSource>
> {
  const {ArcGISSceneServerSourceLoaderWithParser} = await import(
    '@loaders.gl/arcgis/arcgis-scene-server-source-loader'
  );
  return ArcGISSceneServerSourceLoaderWithParser;
}

/** Lightweight service descriptor; use load() or the synchronous /bundled entrypoint. */
export const ArcGISSceneServerSourceLoader = {
  ...ARCGIS_SCENE_SERVER_SOURCE_LOADER_METADATA,
  dataType: null as unknown as ArcGISSceneServerSource,
  batchType: null as never,
  preload: preloadArcGISSceneServerSourceLoader,
  /** Requires the runtime loader when constructing a source synchronously. */
  createDataSource(
    _url: string,
    _options: ArcGISSceneServerSourceOptions,
    _coreApi?: CoreAPI
  ): ArcGISSceneServerSource {
    throw new Error(
      'ArcGISSceneServerSourceLoader requires async load() or an @loaders.gl/arcgis/bundled import'
    );
  }
} as const satisfies SourceLoader<ArcGISSceneServerSource>;
