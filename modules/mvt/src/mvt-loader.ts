import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {MVTLoaderOptions} from './lib/types';
import parseMVT from './lib/parse-mvt';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const DEFAULT_MVT_LOADER_OPTIONS: MVTLoaderOptions = {
  mvt: {
    shape: 'geojson',
    coordinates: 'local',
    layerProperty: 'layerName',
    layers: undefined,
    tileIndex: null
  }
};

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
  options: DEFAULT_MVT_LOADER_OPTIONS
};

/**
 * Loader for the Mapbox Vector Tile format
 */
export const MVTLoader: LoaderWithParser = {
  ...MVTWorkerLoader,
  parse: async (arrayBuffer, options?: MVTLoaderOptions) => parseMVT(arrayBuffer, options),
  parseSync: parseMVT,
  binary: true
};
