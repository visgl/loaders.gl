// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {MVTGeoJSONTable} from './lib/parse-mvt-geojson';
import {parseMVTGeoJSON} from './lib/parse-mvt-geojson';
import {MVTGeoJSONLoader as MVTGeoJSONLoaderMetadata} from './mvt-geojson-loader-types';
import type {MVTGeoJSONLoaderOptions} from './mvt-geojson-loader-types';

const {preload: _MVTGeoJSONLoaderPreload, ...MVTGeoJSONLoaderMetadataWithoutPreload} =
  MVTGeoJSONLoaderMetadata;

/** Parser-bearing GeoJSON-only loader for Mapbox Vector Tiles. */
export const MVTGeoJSONLoaderWithParser = {
  ...MVTGeoJSONLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options?: MVTGeoJSONLoaderOptions) =>
    parseMVTGeoJSON(arrayBuffer, options),
  parseSync: parseMVTGeoJSON
} as const satisfies LoaderWithParser<MVTGeoJSONTable, never, MVTGeoJSONLoaderOptions>;
