// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {GeoJSONTable} from '@loaders.gl/schema';
import {MVTFormat} from './mvt-format';
import type {MVTGeoJSONOptions} from './lib/parse-mvt-geojson';

// __VERSION__ is injected by babel-plugin-version-inline.
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for parsing a Mapbox Vector Tile as a GeoJSON feature collection. */
export type MVTGeoJSONLoaderOptions = LoaderOptions &
  MVTGeoJSONOptions & {
    /** Fixed output shape of this loader. */
    shape?: 'geojson-table';
    mvt?: {
      /** Output shape is fixed to `geojson-table`. */
      shape?: 'geojson-table';
      /** Coordinate system for returned feature coordinates. */
      coordinates?: 'wgs84' | 'local';
      /** Tile index required when coordinates are requested in WGS84. */
      tileIndex?: {x: number; y: number; z: number};
      /** Add each feature's source layer name to this property. */
      layerProperty?: string | number;
      /** Return features from only the named vector-tile layers. */
      layers?: string[];
    };
  };

/** Preload the parser-bearing GeoJSON-only MVT loader. */
async function preload() {
  const {MVTGeoJSONLoaderWithParser} = await import('@loaders.gl/mvt/mvt-geojson-loader');
  return MVTGeoJSONLoaderWithParser;
}

/** Lightweight metadata loader for GeoJSON output from Mapbox Vector Tiles. */
export const MVTGeoJSONLoader = {
  ...MVTFormat,
  name: 'Mapbox Vector Tile (GeoJSON)',
  dataType: null as unknown as GeoJSONTable,
  batchType: null as never,
  version: VERSION,
  worker: false,
  options: {
    mvt: {
      shape: 'geojson-table',
      coordinates: 'local',
      layerProperty: 'layerName',
      layers: undefined!,
      tileIndex: undefined!
    }
  },
  preload,
  binary: true
} as const satisfies Loader<GeoJSONTable, never, MVTGeoJSONLoaderOptions>;
