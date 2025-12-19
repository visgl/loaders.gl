// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {LERCData} from './lib/parsers/lerc/lerc-types';
import * as Lerc from 'lerc';

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

/**
 * Loader for the LERC raster format
 */
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
  parse: async (arrayBuffer: ArrayBuffer, options?: LERCLoaderOptions) =>
    parseLERC(arrayBuffer, options)
} as const satisfies LoaderWithParser<LERCData, never, LERCLoaderOptions>;

async function parseLERC(arrayBuffer: ArrayBuffer, options?: LERCLoaderOptions): Promise<LERCData> {
  // Load the WASM library
  await Lerc.load();
  // Perform the decode
  const pixelBlock = Lerc.decode(arrayBuffer, options?.lerc);
  return pixelBlock;
}
