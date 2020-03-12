// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
import parseMVT from './lib/parse-mvt';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const MVTWorkerLoader = {
  id: 'mvt',
  name: 'Mapbox Vector Tile',
  version: VERSION,
  extensions: ['mvt'],
  mimeType: 'application/x-protobuf',
  category: 'geometry',
  options: {
    mvt: {
      coordinates: 'local',
      layerProperty: 'layerName',
      layers: null,
      tileIndex: null,
      workerUrl: `https://unpkg.com/@loaders.gl/mvt@${VERSION}/dist/mvt-loader.worker.js`
    }
  }
};

export const MVTLoader = {
  ...MVTWorkerLoader,
  parse: async (arrayBuffer, options) => parseMVT(arrayBuffer, options),
  parseSync: parseMVT,
  binary: true
};
