// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NullLoaderMetadata} from './null-loader-metadata';
import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/core/loader-utils';
import {LoaderContext} from '@loaders.gl/core/loader-utils';

export type NullLoaderOptions = LoaderOptions & {
  null?: {};
};

/**
 * Loads any data and returns null (or optionally passes through data unparsed)
 */
export const NullLoader = {
  ...NullLoaderMetadata,
  parse: async (
    arrayBuffer: ArrayBufferLike | ArrayBufferView,
    options?: NullLoaderOptions,
    context?: LoaderContext
  ) => parseSync(arrayBuffer, options || {}, context),
  parseSync,
  parseInBatches: async function* generator(asyncIterator, options, context) {
    for await (const batch of asyncIterator) {
      yield parseSync(batch, options, context);
    }
  }
} as const satisfies LoaderWithParser<null, null, NullLoaderOptions>;

/**
 * Returns arguments passed to the parse API in a format that can be transferred to a
 * web worker. The `context` parameter is stripped using JSON.stringify & parse.
 */
function parseSync(
  arrayBuffer: ArrayBufferLike | ArrayBufferView,
  options?: NullLoaderOptions,
  context?: LoaderContext
): null {
  return null;
}
