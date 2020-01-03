/* global ImageBitmap, Image */
import {global, isBrowser} from '../utils/globals';
import assert from '../utils/assert';

export const IMAGE_BITMAP_SUPPORTED = typeof ImageBitmap !== 'undefined';
export const HTML_IMAGE_SUPPORTED = typeof Image !== 'undefined'; // NOTE: "false" positives if jsdom is installed
export const NODE_IMAGE_SUPPORTED = Boolean(global._parseImageNode);

// Checks if a loaders.gl image type is supported
export function isImageTypeSupported(type) {
  switch (type) {
    case 'auto':
      return true;
    case 'imagebitmap':
      return IMAGE_BITMAP_SUPPORTED;
    case 'html':
      return HTML_IMAGE_SUPPORTED;
    case 'ndarray':
      return NODE_IMAGE_SUPPORTED;
    default:
      throw new Error(`Unknown image format ${type}`);
  }
}

// Returns the best loaders.gl image type supported on current run-time environment
export function getDefaultImageType() {
  if (isImageTypeSupported('ndarray')) {
    return 'ndarray';
  }
  if (isImageTypeSupported('html')) {
    return 'html';
  }
  if (isImageTypeSupported('imagebitmap')) {
    return 'imagebitmap';
  }

  if (!isBrowser) {
    throw new Error(`Install '@loaders.gl/polyfills' to parse images under Node.js`);
  }

  return assert(false); // Internal error, no valid format available, should not happen
}
