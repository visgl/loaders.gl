// Use stackgl modules for DOM-less reading and writing of images

import savePixels from 'save-pixels';
import ndarray from 'ndarray';
import {bufferToArrayBuffer} from '../utils/to-array-buffer.node';

/**
 * Returns data bytes representing a compressed image in PNG or JPG format,
 * This data can be saved using file system (f) methods or
 * used in a request.
 * @param {{data: any; width: number; height: number;}} image to save
 * @param {object} options to save
 * @param {String} [options.type='png'] - png, jpg or image/png, image/jpg are valid
 * @param {String} [options.dataURI] - Whether to include a data URI header
 * @return {*} bytes
 */
export function encodeImageToStreamNode(image, options) {
  // Support MIME type strings
  const type = options.type ? options.type.replace('image/', '') : 'jpeg';
  const pixels = ndarray(image.data, [image.width, image.height, 4], [4, image.width * 4, 1], 0);

  // Note: savePixels returns a stream
  return savePixels(pixels, type, options);
}

export function encodeImageNode(image, options) {
  const imageStream = encodeImageToStreamNode(image, options);

  return new Promise(resolve => {
    const buffers = [];
    imageStream.on('data', buffer => buffers.push(buffer));
    // TODO - convert to arraybuffer?
    imageStream.on('end', () => {
      const buffer = Buffer.concat(buffers);
      resolve(bufferToArrayBuffer(buffer));
    });
  });
}
