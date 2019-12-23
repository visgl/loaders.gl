/* global ImageBitmap, Image */
import assert from '../utils/assert';

export function isImage(image) {
  return Boolean(getImageTypeOrNull(image));
}

export function deleteImage(image) {
  switch (getImageType(image)) {
    case 'imagebitmap':
      image.close();
      break;
    default:
    // Nothing to do for images and ndarrays
  }
}

export function getImageType(image) {
  const format = getImageTypeOrNull(image);
  if (!format) {
    throw new Error('Not an image');
  }
  return format;
}

export function getImageSize(image) {
  switch (getImageType(image)) {
    case 'imagebitmap':
    case 'ndarray':
      return {width: image.width, height: image.height};
    case 'html':
      return {width: image.naturalWidth, height: image.naturalHeight};
    default:
      return assert(false);
  }
}

export function getImageData(image) {
  switch (getImageType(image)) {
    case 'imagebitmap':
    case 'html':
      /* global document */
      const canvas = document.createElement('canvas');
      // TODO - reuse the canvas?
      const context = canvas.getContext('2d');
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(0, 0, image.width, image.height);
      return imageData.data;
    case 'ndarray':
      return image.data;
    default:
      return assert(false);
  }
}

// PRIVATE

function getImageTypeOrNull(image) {
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
  return null;
}
