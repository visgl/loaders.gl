// __VERSION__ is injected by babel-plugin-version-inline
import parseFlatGeobuf, {parseFlatGeobufInBatches} from './lib/parse-flatgeobuf';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const FlatGeobufWorkerLoader = {
  id: 'fgb',
  name: 'FlatGeobuf',
  version: VERSION,
  extensions: ['fgb'],
  category: 'geometry',
  options: {
    fgb: {
      workerUrl: `https://unpkg.com/@loaders.gl/flatgeobuf@${VERSION}/dist/flatgeobuf-loader.worker.js`
    }
  }
};

export const FlatGeobufLoader = {
  ...FlatGeobufWorkerLoader,
  parse: async (arrayBuffer, options) => parseFlatGeobuf(arrayBuffer, options),
  parseSync: parseFlatGeobuf,
  parseInBatchesFromStream: parseFlatGeobufInBatches,
  binary: true
};
