import type {ImageLoaderOptions} from '../../image-loader';
import type {ImageDataType} from '../../types';
import {getBinaryImageMetadata} from '../category-api/binary-image-api';

import * as png from '@jsquash/png';
import * as jpeg from '@jsquash/jpeg';
import * as webp from '@jsquash/webp';
import * as avif from '@jsquash/avif';

export const PARSE_IMAGE_NODE_FORMATS = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif'
]);

/**
 * Parse an image on Node.js using the jsquash wasm libraries
 * Return type is an image data array and metadata
 */
export async function parseImageNode(
  arrayBuffer: ArrayBuffer,
  options: ImageLoaderOptions
): Promise<ImageDataType> {
  const {mimeType} = getBinaryImageMetadata(arrayBuffer) || {};
  switch (mimeType) {
    case 'image/png':
      return await png.decode(arrayBuffer);
    case 'image/jpeg':
      return await jpeg.decode(arrayBuffer);
    case 'image/webp':
      return await webp.decode(arrayBuffer);
    case 'image/avif':
      return await avif.decode(arrayBuffer);
    default:
      throw new Error(`Cannot decode image of type ${mimeType}`);
  }
}
