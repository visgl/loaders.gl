import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import parseMVT from './lib/parse-mvt';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Worker loader for the Mapbox Vector Tile format
 */
export const MVTWorkerLoader: Loader = {
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
      coordinates: 'local',
      layerProperty: 'layerName',
      layers: null,
      tileIndex: null,
      _format: 'geojson'
    }
  }
};

/**
 * Loader for the Mapbox Vector Tile format
 */
export const MVTLoader: LoaderWithParser = {
  ...MVTWorkerLoader,
  parse: async (arrayBuffer, options) => parseMVT(arrayBuffer, options),
  parseSync: parseMVT,
  binary: true
};
