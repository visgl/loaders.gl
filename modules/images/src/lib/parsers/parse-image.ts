import type {LoaderContext} from '@loaders.gl/loader-utils';
import {isBrowser} from '@loaders.gl/loader-utils';
import type {ImageType} from '../../types';
import type {ImageLoaderOptions} from '../../image-loader';
import {parseToImageBitmap} from './parse-to-image-bitmap';
import {parseToNodeImage} from './parse-to-node-image';

const INVALID_IMAGE_TYPE_ERROR =
  "@loaders.gl/images: ImageLoader only accepts options.image.type='imagebitmap'. Remove legacy image/data/auto values and call getImageData(image) if you need raw pixels.";
const UNSUPPORTED_IMAGE_BITMAP_ERROR =
  '@loaders.gl/images: ImageLoader requires browser ImageBitmap support. Use a browser with createImageBitmap support or load images under Node.js with @loaders.gl/polyfills.';

/**
 * Parses images into `ImageBitmap` in browsers and raw image data in Node.js.
 */
export async function parseImage(
  arrayBuffer: ArrayBuffer,
  options?: ImageLoaderOptions,
  context?: LoaderContext
): Promise<ImageType> {
  options = options || {};
  validateImageTypeOption(options);

  if (!isBrowser) {
    return await parseToNodeImage(arrayBuffer, options);
  }

  if (typeof ImageBitmap === 'undefined' || typeof createImageBitmap !== 'function') {
    throw new Error(UNSUPPORTED_IMAGE_BITMAP_ERROR);
  }

  return await parseToImageBitmap(arrayBuffer, options, context?.url);
}

/**
 * Rejects legacy browser output modes now that `ImageLoader` is bitmap-only.
 */
function validateImageTypeOption(options: ImageLoaderOptions): void {
  const imageType = options.image?.type;
  if (imageType && imageType !== 'imagebitmap') {
    throw new Error(INVALID_IMAGE_TYPE_ERROR);
  }
}
