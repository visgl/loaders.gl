// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import type {ArcGISVectorSource} from './arcgis-feature-server-source';
import type {ArcGISFeatureServerSourceLoaderOptions} from './arcgis-feature-server-source-options';
import {ARCGIS_FEATURE_SERVER_SOURCE_DEFAULT_OPTIONS} from './arcgis-feature-server-source-options';
import {ArcGISAuthentication} from '../authentication';

// __VERSION__ is injected by the package build.
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Loads the ArcGIS runtime from its explicit package entry point. */
async function preloadArcGISFeatureServerSourceLoader(): Promise<SourceLoader<ArcGISVectorSource>> {
  const {ArcGISFeatureServerSourceLoaderWithParser} = await import(
    '@loaders.gl/arcgis/arcgis-feature-server-source-loader'
  );
  return ArcGISFeatureServerSourceLoaderWithParser;
}

/** Lightweight ArcGIS service metadata for asynchronous load() and SourceLayer. */
export const ArcGISFeatureServerSourceLoader = {
  dataType: null as unknown as ArcGISVectorSource,
  batchType: null as never,
  name: 'ArcGISFeatureServer',
  id: 'arcgis-feature-server',
  module: 'arcgis',
  version: VERSION,
  /** Supplies the ArcGIS constructor for declarative service credentials. */
  getAuthentications: () => [ArcGISAuthentication],
  extensions: [],
  mimeTypes: [],
  type: 'arcgis-feature-server',
  fromUrl: true,
  fromBlob: false,
  testURL: (url: string): boolean => url.toLowerCase().includes('featureserver'),
  options: ARCGIS_FEATURE_SERVER_SOURCE_DEFAULT_OPTIONS,
  defaultOptions: ARCGIS_FEATURE_SERVER_SOURCE_DEFAULT_OPTIONS,
  preload: preloadArcGISFeatureServerSourceLoader,
  /** Requires the runtime loader for synchronous source construction. */
  createDataSource: (
    url: string,
    options: ArcGISFeatureServerSourceLoaderOptions,
    coreApi?: CoreAPI
  ): ArcGISVectorSource => {
    throw new Error(
      'ArcGISFeatureServerSourceLoader requires async load() or an explicit @loaders.gl/arcgis/arcgis-feature-server-source-loader import'
    );
  }
} as const satisfies SourceLoader<ArcGISVectorSource>;
