// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
import parseFlatGeobuf from './lib/parse-flatgeobuf';

const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const FlatGeobufWorkerLoader = {
  id: 'flatgeobuf',
  name: 'FlatGeobuf',
  category: 'geometry',
  version: VERSION,
  extensions: ['mvt'],
  mimeType: 'application/octetstrem',
  test: 'fgb',
  binary: true,
  options: {
    flatgeobuf: {
      workerUrl: `https://unpkg.com/@loaders.gl/flatgeobuf@${VERSION}/dist/flatgeobuf-loader.worker.js`
    }
  }
};

export const FlatGeobufLoader = {
  ...FlatGeobufWorkerLoader,
  parse: async (arrayBuffer, options) => parseFlatGeobuf(arrayBuffer, options),
  parseSync: parseFlatGeobuf,
  binary: true
};
