// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

import {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';

/**
 * Loads any data and returns null (or optionally passes through data unparsed)
 */
export const NullWorkerLoader: Loader = {
  name: 'Null loader',
  id: 'null',
  module: 'core',
  version: VERSION,
  worker: true,
  mimeTypes: ['application/x.empty'],
  extensions: ['null'],
  tests: [() => false],
  options: {
    null: {}
  }
};

/**
 * Loads any data and returns null (or optionally passes through data unparsed)
 */
export const NullLoader: LoaderWithParser = {
  name: 'Null loader',
  id: 'null',
  module: 'core',
  version: VERSION,
  mimeTypes: ['application/x.empty'],
  extensions: ['null'],
  parse: async (arrayBuffer) => arrayBuffer,
  parseSync: (arrayBuffer) => arrayBuffer,
  parseInBatches: async function* generator(asyncIterator) {
    for await (const batch of asyncIterator) {
      yield batch;
    }
  },
  tests: [() => false],
  options: {
    null: {}
  }
};
