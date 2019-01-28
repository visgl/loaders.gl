// TODO - currently only work in browser, great if could work on all platform image types
/* global document */
import {toArrayBuffer} from '@loaders.gl/core';

export function createImage(width, height) {
  const image = document.createElement('img');
  image.width = width;
  image.height = height;
  image.style.position = 'absolute';
  image.style.top = 0;
  image.style.left = 0;
  return image;
}

export function getImageFromContext(gl) {
  const image = createImage(gl.drawingBufferWidth, gl.drawingBufferHeight);
  return new Promise(resolve => {
    image.onload = () => {
      resolve(image);
    };
    image.src = gl.canvas.toDataURL();
  });
}

export function getImagePixelData(image, width = null, height = null) {
  width = width || image.width;
  height = height || image.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

// Unpacks an image into an HTML image
export function unpackImageAsync(binaryData, {mimeType = 'image/jpeg'}) {
  /* global window, Blob, Image */
  const arrayBuffer = toArrayBuffer(binaryData);
  const blob = new Blob([arrayBuffer], {type: mimeType});
  const urlCreator = window.URL || window.webkitURL;
  const imageUrl = urlCreator.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageUrl;
    return img;
  });
}
