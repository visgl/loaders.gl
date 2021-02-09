/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {WorkerLoaderObject} */
export const NullWorkerLoader = {
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

/** @type {LoaderObject} */
export const NullLoader = {
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
