import type {LoaderContext} from '@loaders.gl/loader-utils';
import {isBrowser} from '@loaders.gl/loader-utils';
import type {ImageBitmapLoaderOptions} from '../../image-bitmap-loader';
import {parseBlobToImageBitmap, parseToImageBitmap} from './parse-to-image-bitmap';
import {isSVG} from './svg-utils';
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
 * Parses Blob images into `ImageBitmap` without first copying to an ArrayBuffer when possible.
 * @param blob Encoded image Blob
 * @param options ImageBitmap loader options
 * @param context Loader context
 * @returns Decoded ImageBitmap
 */
export async function parseImageBitmapBlob(
  blob: Blob,
  options?: ImageBitmapLoaderOptions,
  context?: LoaderContext
): Promise<ImageBitmap> {
  options = options || {};
  validateImageTypeOption(options);
  const hasNodeImageParser = Boolean(globalThis.loaders?.parseImageNode);

  if (
    !isBrowser ||
    hasNodeImageParser ||
    isSVG(context?.url) ||
    blob.type.startsWith('image/svg+xml')
  ) {
    return await parseImageBitmap(await blob.arrayBuffer(), options, context);
  }

  if (typeof ImageBitmap === 'undefined' || typeof createImageBitmap !== 'function') {
    throw new Error(UNSUPPORTED_IMAGE_BITMAP_ERROR);
  }

  return await parseBlobToImageBitmap(blob, options);
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
