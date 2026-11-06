// SPDX-License-Identifier: MIT
import {ImageLUTLoader, type ImageLUTLoaderOptions} from './image-lut-loader-types';
import {ImageLoaderWithParser} from './image-loader';
import {getImageData} from './lib/category-api/parsed-image-api';
import {parseImageLUT} from './lut/parse-image-lut';
const {preload: _preload, ...metadata} = ImageLUTLoader;
/** Decodes PNG samples with color-space conversion disabled, then applies the explicit layout. */
async function parse(data: ArrayBuffer, options?: ImageLUTLoaderOptions) {
  if (!options?.lut) throw new Error('LUT: image layout options are required');
  const bitmap = await ImageLoaderWithParser.parse(data, {
    imagebitmap: {colorSpaceConversion: 'none', premultiplyAlpha: 'none', imageOrientation: 'none'}
  });
  try {
    const pixels = getImageData(bitmap);
    if (!(pixels.data instanceof Uint8Array) && !(pixels.data instanceof Uint8ClampedArray))
      throw new Error('LUT: expected 8-bit image samples');
    return parseImageLUT(pixels.data, pixels.width, pixels.height, options.lut);
  } finally {
    bitmap.close();
  }
}
/** Parser-bearing image LUT loader; explicitly select it instead of automatic PNG detection. */
export const ImageLUTLoaderWithParser = {...metadata, parse} as const;
