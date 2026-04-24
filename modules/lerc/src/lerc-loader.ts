// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {LERCData} from './lib/parsers/lerc/lerc-types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** LERC loader options */
export type LERCLoaderOptions = LoaderOptions & {
  /** LERC loader options */
  lerc?: {
    /**	The number of bytes to skip in the input byte stream. A valid Lerc file is expected at that position. */
    inputOffset?: number;
    /**	It is recommended to use the returned mask instead of setting this value. */
    noDataValue?: number;
    /**	(ndepth LERC2 only) If true, returned depth values are pixel-interleaved. */
    returnInterleaved?: boolean;
  };
};

/** Preloads the parser-bearing LERC loader implementation. */
async function preload() {
  const {LERCLoaderWithParser} = await import('./lerc-loader-with-parser');
  return LERCLoaderWithParser;
}

/** Metadata-only loader for the LERC raster format. */
export const LERCLoader = {
  dataType: null as unknown as LERCData,
  batchType: null as never,

  id: 'lerc',
  name: 'LERC',

  module: 'lerc',
  version: VERSION,
  worker: false,
  extensions: ['lrc', 'lerc', 'lerc2', 'lerc1'],
  mimeTypes: ['application/octet-stream'],
  // test: ?,
  options: {
    lerc: {}
  },
  preload
} as const satisfies Loader<LERCData, never, LERCLoaderOptions>;
