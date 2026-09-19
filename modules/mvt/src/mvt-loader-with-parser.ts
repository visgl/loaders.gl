// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {GeoArrowEncodingPreference} from '@loaders.gl/schema';
// import type {MVTOptions} from './lib/types';
import {parseMVT} from './lib/parse-mvt';
import {deserializeMVTWorkerResult, serializeMVTWorkerResult} from './lib/mvt-worker-transport';
import {MVTLoader as MVTLoaderMetadata} from './mvt-loader';

const {preload: _MVTLoaderPreload, ...MVTLoaderMetadataWithoutPreload} = MVTLoaderMetadata;

export type MVTLoaderOptions = LoaderOptions & {
  /** Preferred encoding for Arrow geometry output. */
  geoarrow?: {encodingPreference?: GeoArrowEncodingPreference};
  mvt?: {
    /** Shape of returned data */
    shape?: 'geojson-table' | 'columnar-table' | 'binary-geometry' | 'arrow-table';
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
    /** Preferred encoding for Arrow geometry output. */
    geoarrow?: {encodingPreference?: GeoArrowEncodingPreference};
  };
};

/**
 * Loader for the Mapbox Vector Tile format
 */
export const MVTLoaderWithParser = {
  ...MVTLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options?: MVTLoaderOptions) => parseMVT(arrayBuffer, options),
  parseSync: parseMVT,
  serializeWorkerResult: serializeMVTWorkerResult,
  deserializeWorkerResult: deserializeMVTWorkerResult
} as const satisfies LoaderWithParser<
  any, // BinaryFeatureCollection | GeoJSONTable | Feature<Geometry, GeoJsonProperties>,
  never,
  MVTLoaderOptions
>;

/** @deprecated Use MVTLoaderWithParser. */
export const MVTWorkerLoaderWithParser = MVTLoaderWithParser;
