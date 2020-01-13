/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
import parseMVT from './lib/parse-mvt';

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
      geojson: true,
      tileProperties: {},
      workerUrl: `https://unpkg.com/@loaders.gl/mvt@${VERSION}/dist/mvt-loader.worker.js`
    }
  }
};

export const MVTLoader = {
  ...MVTWorkerLoader,
  parse: async (arrayBuffer, options) => parseMVT(arrayBuffer, options),
  parseSync: parseMVT,
  binary: true,
  options: {}
};
