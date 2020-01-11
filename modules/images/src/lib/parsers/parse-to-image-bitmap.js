/* global Blob, createImageBitmap */

// Asynchronously parses an array buffer into an ImageBitmap - this contains the decoded data
// Supported on worker threads, not supported on Edge, IE11 and Safari
// https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap#Browser_compatibility

let imagebitmapOptionsSupported = true;

export default function parseToImageBitmap(arrayBuffer, options) {
  // NOTE: In some cases unnecessary conversion to blob (response, blob, file input)
  const blob = new Blob([new Uint8Array(arrayBuffer)]); // MIME type not needed...
  let imagebitmapOptions = options && options.imagebitmap;

  // Firefox crashes if imagebitmapOptions is supplied
  // Avoid supplying if not provided, track if not supported
  if (isEmptyObject(imagebitmapOptions) || !imagebitmapOptionsSupported) {
    imagebitmapOptions = null;
  }

  if (imagebitmapOptions) {
    try {
      return createImageBitmap(blob, imagebitmapOptions);
    } catch (error) {
      console.warn(error); // eslint-disable-line
      imagebitmapOptionsSupported = false;
    }
  }
  return createImageBitmap(blob);
}

function isEmptyObject(object) {
  for (const key in object) {
    return true;
  }
  return false;
}
