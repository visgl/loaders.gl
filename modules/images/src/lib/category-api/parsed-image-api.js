/* global Image, ImageBitmap */
import {assert} from '../utils/assert';

export function isImage(image) {
  return Boolean(getImageTypeOrNull(image));
}

export function deleteImage(image) {
  switch (getImageType(image)) {
    case 'imagebitmap':
      image.close();
      break;
    default:
    // Nothing to do for images and image data objects
  }
}

export function getImageType(image) {
  const format = getImageTypeOrNull(image);
  if (!format) {
    throw new Error('Not an image');
  }
  return format;
}

export function getImageData(image) {
  switch (getImageType(image)) {
    case 'data':
      return image;

    case 'image':
    case 'imagebitmap':
      // Extract the image data from the image via a canvas
      /* global document */
      const canvas = document.createElement('canvas');
      // TODO - reuse the canvas?
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, image.width, image.height);
      }
    // eslint-disable no-fallthrough
    default:
      return assert(false);
  }
}

// TODO DEPRECATED not needed (use getImageData)
export {getImageData as getImageSize};

// PRIVATE

// eslint-disable-next-line complexity
function getImageTypeOrNull(image) {
  if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
    return 'imagebitmap';
  }
  if (typeof Image !== 'undefined' && image instanceof Image) {
    return 'image';
  }
  if (image && typeof image === 'object' && image.data && image.width && image.height) {
    return 'data';
  }
  return null;
}
