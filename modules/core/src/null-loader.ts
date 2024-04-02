// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {LoaderContext} from '@loaders.gl/loader-utils';

export type NullLoaderOptions = LoaderOptions & {
  null?: {};
};

/**
 * Loads any data and returns null (or optionally passes through data unparsed)
 */
export const NullWorkerLoader = {
  dataType: null,
  batchType: null as never,
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
} as const satisfies Loader<null, never, NullLoaderOptions>;

/**
 * Loads any data and returns null (or optionally passes through data unparsed)
 */
export const NullLoader = {
  dataType: null,
  batchType: null,

  name: 'Null loader',
  id: 'null',
  module: 'core',
  version: VERSION,
  mimeTypes: ['application/x.empty'],
  extensions: ['null'],
  parse: async (arrayBuffer: ArrayBuffer, options?: NullLoaderOptions, context?: LoaderContext) =>
    parseSync(arrayBuffer, options || {}, context),
  parseSync,
  parseInBatches: async function* generator(asyncIterator, options, context) {
    for await (const batch of asyncIterator) {
      yield parseSync(batch, options, context);
    }
  },
  tests: [() => false],
  options: {
    null: {}
  }
} as const satisfies LoaderWithParser<null, null, NullLoaderOptions>;

/**
 * Returns arguments passed to the parse API in a format that can be transferred to a
 * web worker. The `context` parameter is stripped using JSON.stringify & parse.
 */
function parseSync(
  arrayBuffer: ArrayBuffer,
  options?: NullLoaderOptions,
  context?: LoaderContext
): null {
  return null;
}
