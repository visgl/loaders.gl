/* global createImageBitmap */
import {isSVG, getBlob} from './svg-utils';
import parseToImage from './parse-to-image';

const EMPTY_OBJECT = {};

let imagebitmapOptionsSupported = true;

/**
 * Asynchronously parses an array buffer into an ImageBitmap - this contains the decoded data
 * ImageBitmaps are supported on worker threads, but not supported on Edge, IE11 and Safari
 * https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap#Browser_compatibility
 *
 * TODO - createImageBitmap supports source rect (5 param overload), pass through?
 */
export default async function parseToImageBitmap(arrayBuffer, options, url) {
  let blob;

  // Cannot parse SVG directly to ImageBitmap, parse to Image first
  if (isSVG(url)) {
    // Note: this only works on main thread
    const image = await parseToImage(arrayBuffer, options, url);
    blob = image;
  } else {
    // Create blob from the array buffer
    blob = getBlob(arrayBuffer, url);
  }

  const imagebitmapOptions = options && options.imagebitmap;

  return await safeCreateImageBitmap(blob, imagebitmapOptions);
}

/**
 * Safely creates an imageBitmap with options
 * *
 * Firefox crashes if imagebitmapOptions is supplied
 * Avoid supplying if not provided or supported, remember if not supported
 */
async function safeCreateImageBitmap(blob, imagebitmapOptions = null) {
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
  for (const key in object || EMPTY_OBJECT) {
    return false;
  }
  return true;
}
