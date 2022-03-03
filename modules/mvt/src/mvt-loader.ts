import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {MVTOptions} from './lib/types';
import parseMVT from './lib/parse-mvt';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type MVTLoaderOptions = LoaderOptions & {
  mvt: MVTOptions & {shape: 'geojson-table' | 'columnar-table' | 'geojson' | 'binary-geometry' };
}

const DEFAULT_MVT_LOADER_OPTIONS: MVTLoaderOptions = {
  mvt: {
    shape: 'geojson',
    coordinates: 'local',
    layerProperty: 'layerName',
    layers: undefined,
    // @ts-expect-error Is this a required param?
    tileIndex: undefined
  }
}

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
  parse: async (arrayBuffer, options) => parseMVT(arrayBuffer, options),
  parseSync: parseMVT,
  binary: true
};
