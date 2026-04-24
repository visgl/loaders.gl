// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import {MLTFormat} from './mlt-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type MLTLoaderOptions = LoaderOptions & {
  mlt?: {
    /** Shape of returned data */
    shape?: 'geojson-table' | 'geojson' | 'binary';
    /** `wgs84`: coordinates in longitude/latitude. `local` coordinates are `0-1` from tile origin */
    coordinates?: 'wgs84' | 'local';
    /** An object containing tile index values (`x`, `y`, `z`) to reproject features' coordinates into WGS84. Mandatory with `wgs84` coordinates option. */
    tileIndex?: {x: number; y: number; z: number};
    /** If provided, the layer name of each feature is added to `feature.properties[layerProperty]`. */
    layerProperty?: string;
    /** Layer filter. If provided, only features belonging to the named layers will be included; otherwise features from all layers are returned. */
    layers?: string[];
  };
};

/** Default options for the MLT loader */
export const MLT_DEFAULT_OPTIONS = {
  shape: 'geojson' as const,
  coordinates: 'local' as const,
  layerProperty: 'layerName' as const
};

/** Preloads the parser-bearing MLT loader implementation. */
async function preload() {
  const {MLTLoaderWithParser} = await import('./mlt-loader-with-parser');
  return MLTLoaderWithParser;
}

/** Metadata-only worker loader for the MapLibre Tile (MLT) format. */
export const MLTWorkerLoader = {
  ...MLTFormat,
  dataType: null as any,
  batchType: null as never,
  version: VERSION,
  worker: false,
  options: {
    mlt: {
      ...MLT_DEFAULT_OPTIONS,
      layers: undefined!,
      tileIndex: undefined!
    }
  },
  preload
} as const satisfies Loader<any, never, MLTLoaderOptions>;

/** Metadata-only loader for the MapLibre Tile (MLT) format. */
export const MLTLoader = {
  ...MLTWorkerLoader,
  binary: true,
  preload
} as const satisfies Loader<any, never, MLTLoaderOptions>;
