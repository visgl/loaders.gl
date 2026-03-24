import type {ImageLoaderOptions} from '../../image-loader';
import {isSVG, getBlob} from './svg-utils';
import {parseToImage} from './parse-to-image';

let imagebitmapOptionsSupported = true;

/**
 * Asynchronously parses an array buffer into an ImageBitmap - this contains the decoded data
 * ImageBitmaps are supported on worker threads, but not supported on Edge, IE11 and Safari
 * https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap#Browser_compatibility
 *
 * TODO - createImageBitmap supports source rect (5 param overload), pass through?
 */
export async function parseToImageBitmap(
  arrayBuffer: ArrayBuffer,
  options: ImageLoaderOptions,
  url?: string
): Promise<ImageBitmap> {
  let imageBitmapSource: Blob | HTMLImageElement;

  // Cannot parse SVG directly to ImageBitmap, parse to Image first
  if (isSVG(url)) {
    // Note: this only works on main thread
    imageBitmapSource = await parseToImage(arrayBuffer, url);
  } else {
    // Create blob from the array buffer
    imageBitmapSource = getBlob(arrayBuffer, url);
  }

  const imageBitmapOptions = (options && options.imagebitmap) as
    | ImageBitmapOptions
    | null
    | undefined;

  return await safeCreateImageBitmap(imageBitmapSource, imageBitmapOptions);
}

/**
 * Safely creates an imageBitmap with options
 * *
 * Firefox crashes if imagebitmapOptions is supplied
 * Avoid supplying if not provided or supported, remember if not supported
 */
async function safeCreateImageBitmap(
  imageBitmapSource: Blob | HTMLImageElement,
  imageBitmapOptions: ImageBitmapOptions | null = null
): Promise<ImageBitmap> {
  if (isEmptyObject(imageBitmapOptions) || !imagebitmapOptionsSupported) {
    imageBitmapOptions = null;
  }

  if (imageBitmapOptions) {
    try {
      // @ts-ignore Options
      return await createImageBitmap(imageBitmapSource, imageBitmapOptions);
    } catch (error) {
      console.warn(error); // eslint-disable-line
      imagebitmapOptionsSupported = false;
    }
  }

  return await createImageBitmap(imageBitmapSource);
}

function isEmptyObject(object: object | null | undefined) {
  if (!object) {
    return true;
  }

  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      return false;
    }
  }

  return true;
}
