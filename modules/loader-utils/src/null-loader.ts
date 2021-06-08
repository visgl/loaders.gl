import {WorkerLoaderObject, LoaderObject} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Loads any data and returns null (or optionally passes through data unparsed)
 * @type {LoaderObject}
 * @todo Should be moved to `@loaders.gl/core`
 */
export const NullWorkerLoader: WorkerLoaderObject = {
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
 * @type {LoaderObject}
 * @todo Should be moved to `@loaders.gl/core`
 */
export const NullLoader: LoaderObject = {
  ...NullWorkerLoader,
  parse: async (arrayBuffer, options) => arrayBuffer,
  parseSync: (arrayBuffer, options) => arrayBuffer,
  // @ts-ignore
  parseInBatches: async (asyncIterator, options) =>
    (async function* parseInBatches() {
      // @ts-ignore
      yield* asyncIterator;
    })()
};
