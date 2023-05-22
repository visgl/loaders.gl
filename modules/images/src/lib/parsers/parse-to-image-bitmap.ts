import type {ImageLoaderOptions} from '../../image-loader';
import {isSVG, getBlob} from './svg-utils';
import {parseToHTMLImage} from './parse-to-html-image';

const EMPTY_OBJECT = {};

let imagebitmapOptionsSupported = true;

/**
 * Asynchronously parses an array buffer into an ImageBitmap - this contains the decoded data
 * ImageBitmaps are supported on worker threads, but not supported on Edge, IE11 and Safari
 * https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap#Browser_compatibility
 * TODO - createImageBitmap supports source rect (5 param overload), pass through?
 */
export async function parseToImageBitmap(
  arrayBuffer: ArrayBuffer,
  options?: ImageLoaderOptions,
  imageBitmapOptions?: ImageBitmapOptions,
  url?: string
): Promise<ImageBitmap> {
  // Browser cannot parse SVG directly to ImageBitmap, so parse to Image first
  if (isSVG(url)) {
    // Note: this only works on main thread
    const image = await parseToHTMLImage(arrayBuffer, options, url);
    return await safeCreateImageBitmap(image, imageBitmapOptions);
  }

  // Create blob from the array buffer
  const blob = getBlob(arrayBuffer, url);
  return await safeCreateImageBitmap(blob, imageBitmapOptions);
}

/**
 * Safely creates an imageBitmap with options:
 * - Firefox crashes if imagebitmapOptions is supplied
 * - Avoid supplying if not provided or supported
 * - remember if not supported to avoid throwing repeated exceptions
 */
async function safeCreateImageBitmap(
  blob: Blob | HTMLImageElement,
  imagebitmapOptions: ImageBitmapOptions | null = null
): Promise<ImageBitmap> {
  if (isEmptyObject(imagebitmapOptions) || !imagebitmapOptionsSupported) {
    imagebitmapOptions = null;
  }

  if (imagebitmapOptions) {
    try {
      // @ts-ignore Options
      return await createImageBitmap(blob, imagebitmapOptions);
    } catch (error) {
      console.warn(error); // eslint-disable-line
      imagebitmapOptionsSupported = false;
    }
  }

  return await createImageBitmap(blob);
}

function isEmptyObject(object) {
  // @ts-ignore
  for (const key in object || EMPTY_OBJECT) {
    return false;
  }
  return true;
}
