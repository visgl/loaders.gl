// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {JSONLoaderMetadata} from './json-loader-metadata';
import type {LoaderWithParser, LoaderOptions} from './loader-types';
import type {Table, TableBatch} from '@loaders.gl/core/schema';

export type JSONLoaderOptions = LoaderOptions;

/**
 * A JSON Micro loader (minimal bundle size)
 * Alternative to `@loaders.gl/tables/json`
 */
export const JSONLoader = {
  ...JSONLoaderMetadata,
  parseTextSync,
  parse: async arrayBuffer => parseTextSync(new TextDecoder().decode(arrayBuffer))
} as const satisfies LoaderWithParser<Table, TableBatch, JSONLoaderOptions>;

// TODO - Better error handling!
function parseTextSync(text) {
  return JSON.parse(text);
}
