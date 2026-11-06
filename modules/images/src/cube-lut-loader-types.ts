// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {VERSION} from './lib/utils/version';
import type {LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {ColorLUT} from './lut/lut-types';
/** Options for LUT decoding. */
export type CubeLUTLoaderOptions = LoaderOptions & {
  /** LUT format options. */
  lut?: {
    /** Required for 3dl: integer output encoding bit depth. */
    outputBitDepth?: number;
  };
};
/** Loads the parser-bearing LUT implementation. */
async function preload() {
  const {CubeLUTLoaderWithParser} = await import('@loaders.gl/images/cube-lut-loader');
  return CubeLUTLoaderWithParser;
}
/** Metadata-only cube color lookup table loader. */
export const CubeLUTLoader = {
  name: 'CubeLUT',
  id: 'cube-lut',
  module: 'images',
  version: VERSION,
  extensions: ['cube'],
  mimeTypes: ['application/x-cube-lut'],
  text: true,
  dataType: null as unknown as ColorLUT,
  batchType: null as never,
  options: {},
  preload
} as const;
