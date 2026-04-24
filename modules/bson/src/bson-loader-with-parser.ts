// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ParseBSONOptions} from './lib/parsers/parse-bson';
import {parseBSONSync} from './lib/parsers/parse-bson';
import {BSONLoader as BSONLoaderMetadata} from './bson-loader';

const {preload: _BSONLoaderPreload, ...BSONLoaderMetadataWithoutPreload} = BSONLoaderMetadata;

/**
 * @param table -
 * @param bsonpaths -
 */
export type BSONLoaderOptions = LoaderOptions & {
  bson?: ParseBSONOptions;
};

export const BSONLoaderWithParser = {
  ...BSONLoaderMetadataWithoutPreload,
  parse,
  parseSync
} as const satisfies LoaderWithParser<Record<string, unknown>, never, BSONLoaderOptions>;

async function parse(arrayBuffer: ArrayBuffer, options?: BSONLoaderOptions) {
  const bsonOptions = {...BSONLoaderWithParser.options.bson, ...options?.bson};
  return parseBSONSync(arrayBuffer, bsonOptions);
}

function parseSync(arrayBuffer: ArrayBuffer, options?: BSONLoaderOptions) {
  const bsonOptions = {...BSONLoaderWithParser.options.bson, ...options?.bson};
  return parseBSONSync(arrayBuffer, bsonOptions);
}
