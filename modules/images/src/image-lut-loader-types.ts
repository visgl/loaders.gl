import {VERSION} from './lib/utils/version';
// SPDX-License-Identifier: MIT
import type {LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {ColorLUT} from './lut/lut-types';
import type {ImageLUTLayout} from './lut/parse-image-lut';
/** Options for explicitly arranged PNG lookup tables. */
export type ImageLUTLoaderOptions = LoaderOptions & {
  /** Required cube size and blue-slice tile arrangement. */
  lut?: ImageLUTLayout;
};
/** Loads the image LUT implementation on demand. */
async function preload() {
  const {ImageLUTLoaderWithParser} = await import('@loaders.gl/images/image-lut-loader');
  return ImageLUTLoaderWithParser;
}
/** Metadata-only loader for explicitly selected PNG color lookup tables. */
export const ImageLUTLoader = {
  name: 'Image LUT',
  id: 'image-lut',
  module: 'images',
  version: VERSION,
  extensions: ['png'],
  mimeTypes: ['image/png'],
  binary: true,
  dataType: null as unknown as ColorLUT,
  batchType: null as never,
  options: {},
  preload
} as const;
