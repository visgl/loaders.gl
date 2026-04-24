import type {LoaderOptions, Loader} from '@loaders.gl/loader-utils';
import type {ArcGISWebSceneData} from './types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type ArcGISWebSceneLoaderOptions = LoaderOptions & {};

/**
 * Loader for ArcGIS WebScene
 * Spec - https://developers.arcgis.com/web-scene-specification/objects/webscene/
 */
export const ArcGISWebSceneLoader = {
  dataType: null as unknown as ArcGISWebSceneData,
  batchType: null as never,
  name: 'ArcGIS Web Scene Loader',
  id: 'arcgis-web-scene',
  module: 'i3s',
  version: VERSION,
  mimeTypes: ['application/json'],
  /** Loads the parser-bearing ArcGIS WebScene loader implementation. */
  preload: async () =>
    (await import('./arcgis-webscene-loader-with-parser')).ArcGISWebSceneLoaderWithParser,
  extensions: ['json'],
  options: {}
} as const satisfies Loader<ArcGISWebSceneData, never, ArcGISWebSceneLoaderOptions>;
