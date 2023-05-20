// Image loading/saving for browser and Node.js
import type {ImageDataType} from '../../types';
import type {EncodeImageOptions} from './encode-image';

import * as png from '@jsquash/png';
import * as jpeg from '@jsquash/jpeg';
import * as webp from '@jsquash/webp';
import * as avif from '@jsquash/avif';

/** Formats supported by encodeImageNode */
export const ENCODE_IMAGE_NODE_FORMATS = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif'
]);

/**
 * Encodes image under node
 * Uses jsquash libraries
 */
export async function encodeImageNode(
  imageData: ImageDataType,
  options?: EncodeImageOptions
): Promise<ArrayBuffer> {
  const mimeType = options?.mimeType || 'image/png';
  const qualityOption = options?.quality ? {quality: options?.quality} : {};

  const domImageData = new ImageData(
    imageData.data as Uint8ClampedArray,
    imageData.width,
    imageData.height
  );
  switch (mimeType) {
    case 'image/png':
      return await png.encode(domImageData); // No options
    case 'image/jpeg':
      return await jpeg.encode(domImageData, qualityOption);
    case 'image/webp':
      return await webp.encode(domImageData, qualityOption);
    case 'image/avif':
      return await avif.encode(domImageData); // Options, but no simple quality option
    default:
      throw new Error(`Cannot encode image of type ${mimeType}`);
  }
}
