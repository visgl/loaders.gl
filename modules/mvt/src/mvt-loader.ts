import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {MVTLoaderOptions} from './lib/types';
// import type {
//   Feature,
//   BinaryFeatures,
//   GeoJSONRowTable,
//   Geometry,
//   GeoJsonProperties
// } from '@loaders.gl/schema';
import parseMVT from './lib/parse-mvt';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Worker loader for the Mapbox Vector Tile format
 */
export const MVTWorkerLoader: Loader<
  any, // BinaryFeatures | GeoJSONRowTable | Feature<Geometry, GeoJsonProperties>,
  never,
  MVTLoaderOptions
> = {
  name: 'Mapbox Vector Tile',
  id: 'mvt',
  module: 'mvt',
  version: VERSION,
  // Note: ArcGIS uses '.pbf' extension and 'application/octet-stream'
  extensions: ['mvt', 'pbf'],
  mimeTypes: [
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
};

/**
 * Loader for the Mapbox Vector Tile format
 */
export const MVTLoader: LoaderWithParser<
  any, // BinaryFeatures | GeoJSONRowTable | Feature<Geometry, GeoJsonProperties>,
  never,
  MVTLoaderOptions
> = {
  ...MVTWorkerLoader,
  parse: async (arrayBuffer, options?: MVTLoaderOptions) => parseMVT(arrayBuffer, options),
  parseSync: parseMVT,
  binary: true
};
