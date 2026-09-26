// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import type {ArcGISImageSource} from './arcgis-image-server-source';
import type {ArcGISImageSourceLoaderProps} from './arcgis-image-server-source-options';
import {ARCGIS_IMAGE_SERVER_SOURCE_DEFAULT_OPTIONS} from './arcgis-image-server-source-options';
import {ArcGISAuthentication} from '../authentication';

// __VERSION__ is injected by the package build.
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Loads the ArcGIS runtime from its explicit package entry point. */
async function preloadArcGISImageServerSourceLoader(): Promise<SourceLoader<ArcGISImageSource>> {
  const {ArcGISImageServerSourceLoaderWithParser} = await import(
    '@loaders.gl/arcgis/arcgis-image-server-source-loader'
  );
  return ArcGISImageServerSourceLoaderWithParser;
}

/** Lightweight ArcGIS service metadata for asynchronous load() and SourceLayer. */
export const ArcGISImageServerSourceLoader = {
  dataType: null as unknown as ArcGISImageSource,
  batchType: null as never,
  name: 'ArcGISImageServer',
  id: 'arcgis-image-server',
  module: 'arcgis',
  version: VERSION,
  /** Supplies the ArcGIS constructor for declarative service credentials. */
  getAuthentications: () => [ArcGISAuthentication],
  extensions: [],
  mimeTypes: [],
  type: 'arcgis-image-server',
  fromUrl: true,
  fromBlob: false,
  testURL: (url: string): boolean => url.toLowerCase().includes('imageserver'),
  options: ARCGIS_IMAGE_SERVER_SOURCE_DEFAULT_OPTIONS,
  defaultOptions: ARCGIS_IMAGE_SERVER_SOURCE_DEFAULT_OPTIONS,
  preload: preloadArcGISImageServerSourceLoader,
  /** Requires the runtime loader for synchronous source construction. */
  createDataSource: (
    url: string,
    props: ArcGISImageSourceLoaderProps,
    coreApi?: CoreAPI
  ): ArcGISImageSource => {
    throw new Error(
      'ArcGISImageServerSourceLoader requires async load() or an explicit @loaders.gl/arcgis/arcgis-image-server-source-loader import'
    );
  }
} as const satisfies SourceLoader<ArcGISImageSource>;
