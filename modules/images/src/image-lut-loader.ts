// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {ImageLUTLoader, type ImageLUTLoaderOptions} from './image-lut-loader-types';
import {ImageLoaderWithParser} from './image-loader';
import {getImageData} from './lib/category-api/parsed-image-api';
import {parseImageLUT, validateImageLUTLayout} from './lut/parse-image-lut';
const {preload: _preload, ...metadata} = ImageLUTLoader;
/** Decodes PNG samples without transform metadata, then applies the explicit layout. */
async function parse(data: ArrayBuffer, options?: ImageLUTLoaderOptions) {
  if (!options?.lut) throw new Error('LUT: image layout options are required');
  const bytes = new Uint8Array(data);
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (
    bytes.length < 33 ||
    signature.some((value, index) => bytes[index] !== value) ||
    new TextDecoder().decode(bytes.subarray(12, 16)) !== 'IHDR'
  )
    throw new Error('LUT: expected PNG bytes');
  if (bytes[24] !== 8) throw new Error('LUT: expected an 8-bit PNG');
  const header = new DataView(data);
  validateImageLUTLayout(header.getUint32(16), header.getUint32(20), options.lut);
  // Generic image APIs can apply these transforms despite bitmap decode options.
  for (let offset = 8; offset < bytes.length; ) {
    if (bytes.length - offset < 12) throw new Error('LUT: truncated PNG chunk');
    const length = header.getUint32(offset);
    if (length > bytes.length - offset - 12) throw new Error('LUT: truncated PNG chunk');
    const name = new TextDecoder().decode(bytes.subarray(offset + 4, offset + 8));
    if (!['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'sRGB'].includes(name))
      throw new Error(`LUT: unsupported PNG metadata chunk ${name}`);
    offset += length + 12;
  }
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
