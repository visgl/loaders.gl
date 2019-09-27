/* global ImageBitmap, Image */
import assert from '../utils/assert';

export function getImageFormat(image) {
  if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
    return 'imagebitmap';
  }
  if (typeof Image !== 'undefined' && image instanceof Image) {
    return 'html';
  }
  if (image && typeof image === 'object' && image.data && image.width && image.height) {
    // Assume this is ndarray
    // TODO - this is not ndarray
    return 'ndarray';
  }
  if (Array.isArray(image)) {
    // Assume this is ndarray
    return 'ndarray';
  }
  return assert(false);
}

export function getImageSize(image) {
  switch (getImageFormat(image)) {
    case 'imagebitmap':
    case 'ndarray':
      return {width: image.width, height: image.height};
    case 'html':
      return {width: image.naturalWidth, height: image.naturalHeight};
    default:
      return assert(false);
  }
}
