// Image loading/saving for browser and Node.js
import {isBrowser} from '@loaders.gl/loader-utils';
import {ImageDataType} from '../../types';
import {encodeImageBrowser} from './encode-image-browser';
import {encodeImageNode} from './encode-image-node';

export type EncodeImageOptions = {
  mimeType?: string; // 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif';
  quality?: number;
  /** @deprecated in 4.0, use quality */
  jpegQuality?: number;
};

/**
 * Returns data bytes representing a compressed image in PNG or JPG format,
 * This data can be saved using file system (f) methods or used in a request.
 * @param image - ImageBitmap Image or Canvas
 * @param options
 * param opt.type='png' - png, jpg or image/png, image/jpg are valid
 * param mimeType= - Whether to include a data URI header
 */
export async function encodeImage(
  image: ImageDataType,
  options?: EncodeImageOptions
): Promise<ArrayBuffer> {
  return isBrowser ? encodeImageBrowser(image, options) : encodeImageNode(image, options);
}
