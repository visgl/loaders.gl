import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArcGisWebSceneData} from './types';

import {parseWebscene} from './lib/parsers/parse-arcgis-webscene';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'beta';

/**
 * Loader for ArcGis WebScene
 * Spec - https://developers.arcgis.com/web-scene-specification/objects/webscene/
 */
export const ArcGisWebSceneLoader: LoaderWithParser<ArcGisWebSceneData, never, LoaderOptions> = {
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
 * Parse ArcGis webscene
 * @param data
 */
async function parse(data: ArrayBuffer): Promise<ArcGisWebSceneData> {
  return parseWebscene(data);
}
