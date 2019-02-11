/* global Image, Blob, createImageBitmap */

// Specifically loads an ImageBitmap (works on newer browser main and worker threads)
export const ImageBitmapLoader = {
  parse: parseToImageBitmap
};

// Specifically loads an HTMLImage (works on alls browser main threads but not on worker threads)
export const HTMLImageLoader = {
  load: loadToHTMLImage
};

// Loads a platform-specific image type that can be used as input data to WebGL textures
export const PlatformImageLoader = {
  parse: parseToPlatformImage,
  load: loadToPlatformImage
};

// TODO - export functions that work on "platform images",
// e.g. extracts image data as typed array from any of the platform image formats.

// Asynchronously parses an array buffer into an ImageBitmap - this contains the decoded data
function parseToImageBitmap(arrayBuffer) {
  const blob = new Blob([new Uint8Array(arrayBuffer)]);
  return createImageBitmap(blob);
}

function loadToHTMLImage(url, options) {
  return new Promise((resolve, reject) => {
    try {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not load image ${url}.`));
      image.crossOrigin = (options && options.crossOrigin) || 'anonymous';
      image.src = url;
    } catch (error) {
      reject(error);
    }
  });
}

function parseToPlatformImage(arrayBuffer) {
  if (typeof createImageBitmap === 'undefined') {
    return null;
  }
  return parseToImageBitmap(arrayBuffer);
}

function loadToPlatformImage(url, options) {
  return loadToHTMLImage(url, options);
}
