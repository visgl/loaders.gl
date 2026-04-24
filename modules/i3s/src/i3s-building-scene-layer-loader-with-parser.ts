import type {LoaderWithParser, LoaderOptions, LoaderContext} from '@loaders.gl/loader-utils';
import type {I3SLoaderOptions} from './i3s-loader';
import type {BuildingSceneLayerTileset} from './types';

import {parseBuildingSceneLayer} from './lib/parsers/parse-i3s-building-scene-layer';
import {I3SBuildingSceneLayerLoader as I3SBuildingSceneLayerLoaderMetadata} from './i3s-building-scene-layer-loader';

const {
  preload: _I3SBuildingSceneLayerLoaderPreload,
  ...I3SBuildingSceneLayerLoaderMetadataWithoutPreload
} = I3SBuildingSceneLayerLoaderMetadata;

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.

/**
 * Loader for I3S - Building Scene Layer
 */
export const I3SBuildingSceneLayerLoaderWithParser = {
  ...I3SBuildingSceneLayerLoaderMetadataWithoutPreload,
  parse
} as const satisfies LoaderWithParser<BuildingSceneLayerTileset, never, I3SLoaderOptions>;

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
