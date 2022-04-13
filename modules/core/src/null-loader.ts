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

function passthrough(arrayBuffer, options, context) {
  context = context && JSON.parse(JSON.stringify(context));
  return {arrayBuffer, options, context};
}

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
  parse: async (arrayBuffer, options, context) => passthrough(arrayBuffer, options, context),
  parseSync: passthrough,
  parseInBatches: async function* generator(asyncIterator, options, context) {
    for await (const batch of asyncIterator) {
      yield passthrough(batch, options, context);
    }
  },
  tests: [() => false],
  options: {
    null: {}
  }
};
