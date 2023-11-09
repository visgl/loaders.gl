import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArcGISWebSceneData} from './types';

import {parseWebscene} from './lib/parsers/parse-arcgis-webscene';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type ArcGISWebSceneLoaderOptions = LoaderOptions & {};

/**
 * Loader for ArcGIS WebScene
 * Spec - https://developers.arcgis.com/web-scene-specification/objects/webscene/
 */
export const ArcGISWebSceneLoader: LoaderWithParser<
  ArcGISWebSceneData,
  never,
  ArcGISWebSceneLoaderOptions
> = {
  name: 'ArcGIS Web Scene Loader',
  id: 'arcgis-web-scene',
  module: 'i3s',
  version: VERSION,
  mimeTypes: ['application/json'],
  parse,
  extensions: ['json'],
  options: {}
};

/**
 * Parse ArcGIS webscene
 * @param data
 */
async function parse(data: ArrayBuffer): Promise<ArcGISWebSceneData> {
  return parseWebscene(data);
}
