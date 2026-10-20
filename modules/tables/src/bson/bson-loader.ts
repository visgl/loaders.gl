// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import {parseBSONSync} from './lib/parsers/parse-bson';
import {BSONLoader as BSONLoaderMetadata} from './bson-loader-types';

import type {BSONLoaderOptions} from './bson-loader-types';

const {preload: _BSONLoaderPreload, ...BSONLoaderMetadataWithoutPreload} = BSONLoaderMetadata;

export type {BSONLoaderOptions} from './bson-loader-types';

/** Parser-bearing loader for BSON files. */
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
