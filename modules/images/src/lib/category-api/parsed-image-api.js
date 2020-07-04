/* global Image, ImageBitmap */
import assert from '../utils/assert';

export function isImage(image) {
  return Boolean(getImageType(image, false));
}

export function getImageType(image, throwOnError = false) {
  if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
    return 'imagebitmap';
  }
  if (typeof Image !== 'undefined' && image instanceof Image) {
    return 'image';
  }
  if (image && typeof image === 'object' && image.data && image.width && image.height) {
    return 'data';
  }
  if (throwOnError) {
    throw new Error('Not an image');
  }
  return null;
}

export function getImageData(image) {
  switch (getImageType(image)) {
    case 'data':
      return image;

    case 'image':
    case 'imagebitmap':
      // Extract the image data from the image via a canvas
      // TODO - reuse the canvas?
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0);
      return context.getImageData(0, 0, image.width, image.height);
    default:
      return assert(false);
  }
}

export function getImageSize(image) {
  // imagebitmap and data has width, image has naturalWidth
  return Number.isFinite(image.width)
    ? {width: image.width, height: image.height}
    : {width: image.naturalWidth, height: image.naturalHeight};
}
