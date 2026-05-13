// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ParseBSONOptions} from './lib/parsers/parse-bson';
import {BSONFormat} from './bson-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * BSON loader options.
 */
export type BSONLoaderOptions = LoaderOptions & {
  bson?: ParseBSONOptions;
};

/** Preloads the parser-bearing BSON loader implementation. */
async function preload() {
  const {BSONLoaderWithParser} = await import('./bson-loader-with-parser');
  return BSONLoaderWithParser;
}

/** Metadata-only loader for BSON files. */
export const BSONLoader = {
  ...BSONFormat,
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
  options: {
    bson: {}
  },
  preload
} as const satisfies Loader<Record<string, unknown>, never, BSONLoaderOptions>;
