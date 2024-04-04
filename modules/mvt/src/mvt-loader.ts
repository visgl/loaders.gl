// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {parseMVT} from './lib/parse-mvt';
import type {MVTOptions} from './lib/types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type MVTLoaderOptions = LoaderOptions & {
  mvt?: MVTOptions & {
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
  gis?: {
    /** `true`: parser will output the data in binary format. Equivalent to loading the data as GeoJSON and then applying geojsonToBinary */
    binary?: boolean;
    /** @deprecated. Use options.mvt.shape */
    format?: 'geojson-table' | 'columnar-table' | 'geojson' | 'binary' | 'binary-geometry';
  };
};

/**
 * Worker loader for the Mapbox Vector Tile format
 */
export const MVTWorkerLoader = {
  dataType: null as any,
  batchType: null as never,

  name: 'Mapbox Vector Tile',
  id: 'mvt',
  module: 'mvt',
  version: VERSION,
  // Note: ArcGIS uses '.pbf' extension and 'application/octet-stream'
  extensions: ['mvt', 'pbf'],
  mimeTypes: [
    // https://www.iana.org/assignments/media-types/application/vnd.mapbox-vector-tile
    'application/vnd.mapbox-vector-tile',
    'application/x-protobuf'
    // 'application/octet-stream'
  ],
  worker: true,
  category: 'geometry',
  options: {
    mvt: {
      shape: 'geojson',
      coordinates: 'local',
      layerProperty: 'layerName',
      layers: undefined,
      tileIndex: null
    }
  }
} as const satisfies Loader<
  any, // BinaryFeatureCollection | GeoJSONTable | Feature<Geometry, GeoJsonProperties>,
  never,
  MVTLoaderOptions
>;

/**
 * Loader for the Mapbox Vector Tile format
 */
export const MVTLoader = {
  ...MVTWorkerLoader,
  parse: async (arrayBuffer, options?: MVTLoaderOptions) => parseMVT(arrayBuffer, options),
  parseSync: parseMVT,
  binary: true
} as const satisfies LoaderWithParser<
  any, // BinaryFeatureCollection | GeoJSONTable | Feature<Geometry, GeoJsonProperties>,
  never,
  MVTLoaderOptions
>;
