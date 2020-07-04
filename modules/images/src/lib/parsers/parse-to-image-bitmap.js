/* global createImageBitmap */
import {isSVG} from './svg-utils';
import parseToImage from './parse-to-image';

/**
 * Asynchronously parses an array buffer into an ImageBitmap - this contains the decoded data
 * ImageBitmaps are supported on worker threads, but not supported on Edge, IE11 and Safari
 * https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap#Browser_compatibility
 *
 * TODO - createImageBitmap supports source rect (5 param overload), pass through?
 */
export default async function parseToImageBitmap(arrayBuffer, options, url) {
  // Cannot parse SVG directly to ImageBitmap, parse to Image first (only works on main thread)
  const blobOrImage = isSVG(url)
    ? await parseToImage(arrayBuffer, options, url)
    // Create blob from the array buffer
    : new Blob([arrayBuffer]);

  const imagebitmapOptions = options && options.imagebitmap;

  return await safeCreateImageBitmap(blobOrImage, imagebitmapOptions);
}

let imagebitmapOptionsSupported = true;

/**
 * Safely creates an imageBitmap with options
 *
 * Firefox crashes if imagebitmapOptions is supplied
 * Avoid supplying if not provided or supported, remember if not supported
 */
async function safeCreateImageBitmap(blob, imagebitmapOptions = null) {
  if (imagebitmapOptions && imagebitmapOptionsSupported) {
    try {
      // @ts-ignore Options
      return await createImageBitmap(blob, imagebitmapOptions);
    } catch (error) {
      imagebitmapOptionsSupported = false;
    }
  }

  // Call without imagebitmapOptions
  return await createImageBitmap(blob);
}
