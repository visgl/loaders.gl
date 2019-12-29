/* global ImageBitmap, Image */
import {global, isBrowser} from '../utils/globals';

const IMAGE_SUPPORTED = typeof Image !== 'undefined'; // NOTE: "false" positives if jsdom is installed
const IMAGE_BITMAP_SUPPORTED = typeof ImageBitmap !== 'undefined';
const NODE_IMAGE_SUPPORTED = Boolean(global._parseImageNode);

// Checks if a loaders.gl image type is supported
export function isImageTypeSupported(type) {
  switch (type) {
    case 'auto':
      // Should only ever be false in Node.js, if polyfills have not been installed...
      return IMAGE_BITMAP_SUPPORTED || IMAGE_SUPPORTED || NODE_IMAGE_SUPPORTED;

    case 'imagebitmap':
      return IMAGE_BITMAP_SUPPORTED;

    case 'html': // type `html` is deprecated, use `image`
    // eslint-disable-next-line no-fallthrough
    case 'image':
      return IMAGE_SUPPORTED;

    case 'ndarray': // type `ndarray` is deprecated, use 'data'
    // eslint-disable-next-line no-fallthrough
    case 'data':
      return isBrowser ? true : NODE_IMAGE_SUPPORTED;

    default:
      throw new Error(`@loaders.gl/images: image ${type} not supported in this environment`);
  }
}

// Returns the best loaders.gl image type supported on current run-time environment
export function getDefaultImageType() {
  // TODO - switch order... we want to return imagebitmap by default
  if (isImageTypeSupported('image')) {
    return 'image';
  }
  if (isImageTypeSupported('imagebitmap')) {
    return 'imagebitmap';
  }
  if (isImageTypeSupported('data')) {
    return 'data';
  }

  // This should only happen in Node.js
  throw new Error(`Install '@loaders.gl/polyfills' to parse images under Node.js`);
}
