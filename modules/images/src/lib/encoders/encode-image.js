// Image loading/saving for browser
/* global document, HTMLCanvasElement, Image */

import assert from '../utils/assert';
import {global} from '../utils/globals';

// @ts-ignore TS2339: Property does not exist on type
const {_encodeImageNode} = global;

export function encodeImage(image, type) {
  if (_encodeImageNode) {
    // @ts-ignore TS2339: Property does not exist on type
    return _encodeImageNode(image, type);
  }

  if (image instanceof HTMLCanvasElement) {
    const canvas = image;
    return canvas.toDataURL(type);
  }

  assert(image instanceof Image, 'getImageData accepts image or canvas');
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  canvas.getContext('2d').drawImage(image, 0, 0);

  // Get raw image data
  const data = canvas.toDataURL(type || 'png').replace(/^data:image\/(png|jpg);base64,/, '');
  return Promise.resolve(data);
}
