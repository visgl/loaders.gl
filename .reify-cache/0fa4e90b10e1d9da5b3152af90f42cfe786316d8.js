"use strict";module.export({encodeImageToStreamNode:()=>encodeImageToStreamNode,encodeImageNode:()=>encodeImageNode});var savePixels;module.link('save-pixels',{default(v){savePixels=v}},0);var ndarray;module.link('ndarray',{default(v){ndarray=v}},1);var bufferToArrayBuffer;module.link('./buffer-to-array-buffer',{bufferToArrayBuffer(v){bufferToArrayBuffer=v}},2);// Use stackgl modules for DOM-less reading and writing of images

/* global Buffer */




/**
 * Returns data bytes representing a compressed image in PNG or JPG format,
 * This data can be saved using file system (f) methods or
 * used in a request.
 * @param {Image} image to save
 * @param {String} type='png' - png, jpg or image/png, image/jpg are valid
 * @param {String} opt.dataURI= - Whether to include a data URI header
 * @return {*} bytes
 */
function encodeImageToStreamNode(image, options) {
  // Support MIME type strings
  const type = options.type ? options.type.replace('image/', '') : 'jpeg';
  const pixels = ndarray(image.data, [image.width, image.height, 4], [4, image.width * 4, 1], 0);

  // Note: savePixels returns a stream
  return savePixels(pixels, type, options);
}

function encodeImageNode(image, options) {
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
