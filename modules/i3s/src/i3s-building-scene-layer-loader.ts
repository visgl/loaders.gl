import type {LoaderWithParser, LoaderOptions, LoaderContext} from '@loaders.gl/loader-utils';
import type {BuildingSceneLayerTileset} from './types';

import {parseBuildingSceneLayer} from './lib/parsers/parse-i3s-building-scene-layer';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.

const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'beta';
/**
 * Loader for I3S - Building Scene Layer
 */
export const I3SBuildingSceneLayerLoader: LoaderWithParser = {
  name: 'I3S Building Scene Layer',
  id: 'i3s-building-scene-layer',
  module: 'i3s',
  version: VERSION,
  mimeTypes: ['application/json'],
  parse,
  extensions: ['json'],
  options: {}
};

async function parse(
  data: ArrayBuffer,
  options?: LoaderOptions,
  context?: LoaderContext
): Promise<BuildingSceneLayerTileset> {
  if (!context?.url) {
    throw new Error('Url is not provided');
  }

  return parseBuildingSceneLayer(data, context.url);
}
