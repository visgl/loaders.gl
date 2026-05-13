import type {LoaderContext} from '@loaders.gl/loader-utils';
import {isBrowser} from '@loaders.gl/loader-utils';
import type {ImageBitmapLoaderOptions} from '../../image-bitmap-loader';
import {parseToImageBitmap} from './parse-to-image-bitmap';
import {parseToNodeImage} from './parse-to-node-image';

const INVALID_IMAGE_TYPE_ERROR =
  "@loaders.gl/images: ImageBitmapLoader only accepts options.image.type='imagebitmap'. Remove legacy image/data/auto values and call getImageData(image) if you need raw pixels.";
const UNSUPPORTED_IMAGE_BITMAP_ERROR =
  '@loaders.gl/images: ImageBitmapLoader requires browser ImageBitmap support. Use a browser with createImageBitmap support or load images under Node.js with @loaders.gl/polyfills.';

/**
 * Parses images into `ImageBitmap` in browsers and Node.js.
 */
export async function parseImageBitmap(
  arrayBuffer: ArrayBuffer,
  options?: ImageBitmapLoaderOptions,
  context?: LoaderContext
): Promise<ImageBitmap> {
  options = options || {};
  validateImageTypeOption(options);
  const hasNodeImageParser = Boolean(globalThis.loaders?.parseImageNode);

  if (!isBrowser || hasNodeImageParser) {
    return await parseToNodeImage(arrayBuffer, options);
  }

  if (typeof ImageBitmap === 'undefined' || typeof createImageBitmap !== 'function') {
    throw new Error(UNSUPPORTED_IMAGE_BITMAP_ERROR);
  }

  return await parseToImageBitmap(arrayBuffer, options, context?.url);
}

/**
 * Rejects legacy browser output modes for `ImageBitmapLoader`.
 */
function validateImageTypeOption(options: ImageBitmapLoaderOptions): void {
  const imageType = options.image?.type;
  if (imageType && imageType !== 'imagebitmap') {
    throw new Error(INVALID_IMAGE_TYPE_ERROR);
  }
}
