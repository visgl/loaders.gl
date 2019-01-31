// TODO - currently only work in browser, great if could work on all platform image types
/* global document */

// Unpacks compressed image data into an HTML image
export function decodeImage(arrayBufferOrView, {mimeType = 'image/jpeg'}) {
  /* global window, Blob, Image */
  const blob = new Blob([arrayBufferOrView], {type: mimeType});
  const urlCreator = window.URL || window.webkitURL;
  const imageUrl = urlCreator.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = imageUrl;
    return image;
  });
}

// Get (uncompressed) image pixel data
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

/* TODO - move to luma.gl?
export function getImageFromContext(gl) {
  const image = createImage(gl.drawingBufferWidth, gl.drawingBufferHeight);
  return new Promise(resolve => {
    image.onload = () => {
      resolve(image);
    };
    image.src = gl.canvas.toDataURL();
  });
}

function createImage(width, height) {
  const image = document.createElement('img');
  image.width = width;
  image.height = height;
  image.style.position = 'absolute';
  image.style.top = 0;
  image.style.left = 0;
  return image;
}s
*/
