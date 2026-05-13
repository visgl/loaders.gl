import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArcGISWebSceneData} from './types';

import {parseWebscene} from './lib/parsers/parse-arcgis-webscene';
import {ArcGISWebSceneLoader as ArcGISWebSceneLoaderMetadata} from './arcgis-webscene-loader';

const {preload: _ArcGISWebSceneLoaderPreload, ...ArcGISWebSceneLoaderMetadataWithoutPreload} =
  ArcGISWebSceneLoaderMetadata;

export type ArcGISWebSceneLoaderOptions = LoaderOptions & {};

/**
 * Loader for ArcGIS WebScene
 * Spec - https://developers.arcgis.com/web-scene-specification/objects/webscene/
 */
export const ArcGISWebSceneLoaderWithParser = {
  ...ArcGISWebSceneLoaderMetadataWithoutPreload,
  parse,
  parseText: parse
} as const satisfies LoaderWithParser<ArcGISWebSceneData, never, ArcGISWebSceneLoaderOptions>;

/**
 * Parse ArcGIS webscene
 * @param data - WebScene JSON as text or encoded bytes.
 */
async function parse(data: string | ArrayBuffer): Promise<ArcGISWebSceneData> {
  return parseWebscene(data);
}
