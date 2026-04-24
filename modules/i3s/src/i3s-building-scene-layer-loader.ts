import type {Loader} from '@loaders.gl/loader-utils';
import type {I3SLoaderOptions} from './i3s-loader';
import type {BuildingSceneLayerTileset} from './types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.

const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Loader for I3S - Building Scene Layer
 */
export const I3SBuildingSceneLayerLoader = {
  dataType: null as unknown as BuildingSceneLayerTileset,
  batchType: null as never,

  name: 'I3S Building Scene Layer',
  id: 'i3s-building-scene-layer',
  module: 'i3s',
  version: VERSION,
  mimeTypes: ['application/json'],
  /** Loads the parser-bearing I3S building scene layer loader implementation. */
  preload: async () =>
    (await import('./i3s-building-scene-layer-loader-with-parser'))
      .I3SBuildingSceneLayerLoaderWithParser,
  extensions: ['json'],
  options: {}
} as const satisfies Loader<BuildingSceneLayerTileset, never, I3SLoaderOptions>;
