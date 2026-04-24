// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
// import type {MVTOptions} from './lib/types';
import {parseMVT} from './lib/parse-mvt';
import {MVTWorkerLoader as MVTWorkerLoaderMetadata} from './mvt-loader';
import {MVTLoader as MVTLoaderMetadata} from './mvt-loader';

const {preload: _MVTWorkerLoaderPreload, ...MVTWorkerLoaderMetadataWithoutPreload} =
  MVTWorkerLoaderMetadata;
const {preload: _MVTLoaderPreload, ...MVTLoaderMetadataWithoutPreload} = MVTLoaderMetadata;

export type MVTLoaderOptions = LoaderOptions & {
  mvt?: {
    /** Shape of returned data */
    shape?: 'geojson-table' | 'columnar-table' | 'geojson' | 'binary' | 'binary-geometry';
    /** `wgs84`: coordinates in long, lat (`tileIndex` must be provided. `local` coordinates are `0-1` from tile origin */
    coordinates?: 'wgs84' | 'local';
    /** An object containing tile index values (`x`, `y`, `z`) to reproject features' coordinates into WGS84. Mandatory with `wgs84` coordinates option. */
    tileIndex?: {x: number; y: number; z: number};
    /** If provided, stored the layer name of each feature is added to `feature.properties[layerProperty]`. */
    layerProperty?: string | number;
    /** layer filter. If provided, only features belonging to the named layers will be included, otherwise features from all layers are returned. */
    layers?: string[];
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
  gis?: {
    /** @deprecated Use options.mvt.shape === 'binary-geometry' */
    binary?: boolean;
    /** @deprecated. Use options.mvt.shape */
    format?: 'geojson-table' | 'columnar-table' | 'geojson' | 'binary' | 'binary-geometry';
  };
};

/**
 * Worker loader for the Mapbox Vector Tile format
 */
export const MVTWorkerLoaderWithParser = {
  ...MVTWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<
  any, // BinaryFeatureCollection | GeoJSONTable | Feature<Geometry, GeoJsonProperties>,
  never,
  MVTLoaderOptions
>;

/**
 * Loader for the Mapbox Vector Tile format
 */
export const MVTLoaderWithParser = {
  ...MVTLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options?: MVTLoaderOptions) => parseMVT(arrayBuffer, options),
  parseSync: parseMVT
} as const satisfies LoaderWithParser<
  any, // BinaryFeatureCollection | GeoJSONTable | Feature<Geometry, GeoJsonProperties>,
  never,
  MVTLoaderOptions
>;
