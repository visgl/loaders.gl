import {Loader, LoaderWithParser} from './types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Loads any data and returns null (or optionally passes through data unparsed)
 * @todo Should be moved to `@loaders.gl/core`
 */
export const NullWorkerLoader: Loader = {
  name: 'Null loader',
  id: 'null',
  module: 'loader-utils',
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
 * @todo Should be moved to `@loaders.gl/core`
 */
export const NullLoader: LoaderWithParser = {
  ...NullWorkerLoader,
  parse: async (arrayBuffer) => arrayBuffer,
  parseSync: (arrayBuffer) => arrayBuffer,
  // @ts-ignore
  parseInBatches: async (asyncIterator) =>
    (async function* parseInBatches() {
      // @ts-ignore
      yield* asyncIterator;
    })()
};
