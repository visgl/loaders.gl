import {getBlobOrSVGDataUrl} from './svg-utils';

// Parses html image from array buffer
export default async function parseToImage(arrayBuffer, options, url) {
  // Note: image parsing requires conversion to Blob (for createObjectURL).
  // Potentially inefficient for not using `response.blob()` (and for File / Blob inputs)...
  // But presumably not worth adding 'blob' flag to loader objects?

  const blobOrDataUrl = getBlobOrSVGDataUrl(arrayBuffer, url);
  const URL = self.URL || self.webkitURL;
  const objectUrl = typeof blobOrDataUrl !== 'string' && URL.createObjectURL(blobOrDataUrl);
  try {
    return await loadToImage(objectUrl || blobOrDataUrl, options);
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

export async function loadToImage(url, options) {
  const image = new Image();
  image.src = url;

  // The `image.onload()` callback does not guarantee that the image has been decoded
  // so a main thread "freeze" can be incurred when using the image for the first time.
  // `Image.decode()` returns a promise that completes when image is decoded.

  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode
  // Note: When calling `img.decode()`, we do not need to wait for `img.onload()`
  // Note: `HTMLImageElement.decode()` is not available in Edge and IE11
  if (options.image && options.image.decode && image.decode) {
    await image.decode();
    return image;
  }

  // Create a promise that tracks onload/onerror callbacks
  return await new Promise((resolve, reject) => {
    try {
      image.onload = () => resolve(image);
      image.onerror = err => reject(new Error(`Could not load image ${url}: ${err}`));
    } catch (error) {
      reject(error);
    }
  });
}
