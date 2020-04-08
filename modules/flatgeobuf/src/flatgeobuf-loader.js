// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
import parseMVT from './lib/parse-mvt';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const FlatGeobufWorkerLoader = {
  id: 'fgb',
  name: 'FlatGeobuf',
  version: VERSION,
  extensions: ['fgb'],
  // mimeType: 'application/x-protobuf',
  category: 'geometry',
  options: {
    fgb: {
      // coordinates: 'local',
      // layerProperty: 'layerName',
      // layers: null,
      // tileIndex: null,
      workerUrl: `https://unpkg.com/@loaders.gl/flatgeobuf@${VERSION}/dist/flatgeobuf-loader.worker.js`
    }
  }
};

export const FlatGeobufLoader = {
  ...FlatGeobufWorkerLoader,
  parse: async (arrayBuffer, options) => parseMVT(arrayBuffer, options),
  parseSync: parseMVT,
  binary: true
};
