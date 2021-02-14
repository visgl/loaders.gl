/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
import parseMVT from './lib/parse-mvt';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Worker loader for the Mapbox Vector Tile format
 * @type {WorkerLoaderObject}
 */
export const MVTWorkerLoader = {
  name: 'Mapbox Vector Tile',
  id: 'mvt',
  module: 'mvt',
  version: VERSION,
  extensions: ['mvt'],
  mimeTypes: ['application/x-protobuf', 'application/vnd.mapbox-vector-tile'],
  category: 'geometry',
  options: {
    mvt: {
      coordinates: 'local',
      layerProperty: 'layerName',
      layers: null,
      tileIndex: null,
      _format: 'geojson',
      workerUrl: `https://unpkg.com/@loaders.gl/mvt@${VERSION}/dist/mvt-loader.worker.js`
    }
  }
};

/**
 * Loader for the Mapbox Vector Tile format
 * @type {LoaderObject}
 */
export const MVTLoader = {
  ...MVTWorkerLoader,
  parse: async (arrayBuffer, options) => parseMVT(arrayBuffer, options),
  parseSync: parseMVT,
  binary: true
};
