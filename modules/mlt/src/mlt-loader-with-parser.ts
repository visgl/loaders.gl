// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {parseMLT} from './lib/parse-mlt';
import {MLTWorkerLoader as MLTWorkerLoaderMetadata} from './mlt-loader';
import {MLTLoader as MLTLoaderMetadata} from './mlt-loader';

const {preload: _MLTWorkerLoaderPreload, ...MLTWorkerLoaderMetadataWithoutPreload} =
  MLTWorkerLoaderMetadata;
const {preload: _MLTLoaderPreload, ...MLTLoaderMetadataWithoutPreload} = MLTLoaderMetadata;

export type MLTLoaderOptions = LoaderOptions & {
  mlt?: {
    /** Shape of returned data */
    shape?: 'geojson-table' | 'binary-geometry';
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
  shape: 'geojson-table' as const,
  coordinates: 'local' as const,
  layerProperty: 'layerName' as const
};

/**
 * Worker loader for the MapLibre Tile (MLT) format
 */
export const MLTWorkerLoaderWithParser = {
  ...MLTWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<any, never, MLTLoaderOptions>;

/**
 * Loader for the MapLibre Tile (MLT) format
 */
export const MLTLoaderWithParser = {
  ...MLTLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: MLTLoaderOptions) =>
    parseMLT(arrayBuffer, options),
  parseSync: (arrayBuffer: ArrayBuffer, options?: MLTLoaderOptions) =>
    parseMLT(arrayBuffer, options)
} as const satisfies LoaderWithParser<any, never, MLTLoaderOptions>;
