/* global Image, ImageBitmap */
import {assert} from '@loaders.gl/loader-utils';

export function getImageData(image) {
  switch (getImageTypeOrNull(image)) {
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
      return assert(false);

    default:
      return assert(false);
  }
}

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
