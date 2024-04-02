// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ParseBSONOptions} from './lib/parsers/parse-bson';
import {parseBSONSync} from './lib/parsers/parse-bson';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * @param table -
 * @param bsonpaths -
 */
export type BSONLoaderOptions = LoaderOptions & {
  bson?: ParseBSONOptions;
};

export const BSONLoader = {
  dataType: null as unknown as Record<string, unknown>,
  batchType: null as never,
  name: 'BSON',
  id: 'bson',
  module: 'bson',
  version: VERSION,
  extensions: ['bson'],
  mimeTypes: ['application/bson'],
  category: 'json',
  binary: true,
  parse,
  parseSync,
  options: {
    bson: {}
  }
} as const satisfies LoaderWithParser<Record<string, unknown>, never, BSONLoaderOptions>;

async function parse(arrayBuffer: ArrayBuffer, options?: BSONLoaderOptions) {
  const bsonOptions = {...BSONLoader.options.bson, ...options?.bson};
  return parseBSONSync(arrayBuffer, bsonOptions);
}

function parseSync(arrayBuffer: ArrayBuffer, options?: BSONLoaderOptions) {
  const bsonOptions = {...BSONLoader.options.bson, ...options?.bson};
  return parseBSONSync(arrayBuffer, bsonOptions);
}
