// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

/**
 * Loads any data and returns null (or optionally passes through data unparsed)
 * @type {LoaderObject}
 * @todo Should be moved to `@loaders.gl/core`
 * */
export const NullLoader = {
  name: 'Null loader',
  id: 'null',
  module: 'core',
  version: VERSION,
  mimeTypes: ['application/x.empty'],
  extensions: ['null'],
  parse: async (arrayBuffer, options) => arrayBuffer,
  parseSync: (arrayBuffer, options) => arrayBuffer,
  // @ts-ignore
  parseInBatches: async (asyncIterator, options) =>
    (async function* parseInBatches() {
      // @ts-ignore
      yield* asyncIterator;
    })(),
  tests: [() => false],
  options: {
    null: {}
  }
};
