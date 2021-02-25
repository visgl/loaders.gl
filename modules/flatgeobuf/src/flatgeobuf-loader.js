// __VERSION__ is injected by babel-plugin-version-inline
import parseFlatGeobuf, {parseFlatGeobufInBatches} from './lib/parse-flatgeobuf';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const FlatGeobufWorkerLoader = {
  id: 'flatgeobuf',
  name: 'FlatGeobuf',
  module: 'flatgeobuf',
  version: VERSION,
  worker: true,
  extensions: ['fgb'],
  category: 'geometry',
  options: {
    flatgeobuf: {}
  }
};

export const FlatGeobufLoader = {
  ...FlatGeobufWorkerLoader,
  parse: async (arrayBuffer, options) => parseFlatGeobuf(arrayBuffer, options),
  parseSync: parseFlatGeobuf,
  parseInBatchesFromStream: parseFlatGeobufInBatches,
  binary: true
};
