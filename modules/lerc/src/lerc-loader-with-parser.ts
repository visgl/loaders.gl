// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {LERCData} from './lib/parsers/lerc/lerc-types';
import * as Lerc from 'lerc';
import {LERCLoader as LERCLoaderMetadata} from './lerc-loader';

const {preload: _LERCLoaderPreload, ...LERCLoaderMetadataWithoutPreload} = LERCLoaderMetadata;

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
export const LERCLoaderWithParser = {
  ...LERCLoaderMetadataWithoutPreload,
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
