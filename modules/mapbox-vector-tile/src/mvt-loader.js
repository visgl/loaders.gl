/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
import parseMVT from './lib/parse-mvt';

const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const MapboxVectorTileLoader = {
  id: 'mvt',
  name: 'Mapbox Vector Tile',
  version: VERSION,
  extensions: ['mvt'],
  mimeType: 'application/x-protobuf',
  category: 'geometry',
  parse: async (arrayBuffer, options) => parseMVT(arrayBuffer, options),
  parseSync: parseMVT,
  binary: true,
  testText: null,
  options: {
    mvt: {}
  }
};
