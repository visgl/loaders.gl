// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {VERSION} from './lib/utils/version';
import type {LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {ColorLUT} from './lut/lut-types';
/** Options for LUT decoding. */
export type ThreeDLLUTLoaderOptions = LoaderOptions & {
  /** LUT format options. */
  lut?: {
    /** Required for 3dl: integer output encoding bit depth. */
    outputBitDepth?: number;
  };
};
/** Loads the parser-bearing LUT implementation. */
async function preload() {
  const {ThreeDLLUTLoaderWithParser} = await import('@loaders.gl/images/3dl-lut-loader');
  return ThreeDLLUTLoaderWithParser;
}
/** Metadata-only 3dl color lookup table loader. */
export const ThreeDLLUTLoader = {
  name: 'ThreeDLLUT',
  id: '3dl-lut',
  module: 'images',
  version: VERSION,
  extensions: ['3dl'],
  mimeTypes: ['application/x-3dl-lut'],
  text: true,
  dataType: null as unknown as ColorLUT,
  batchType: null as never,
  options: {},
  preload
} as const;
