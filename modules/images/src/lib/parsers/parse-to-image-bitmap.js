/* global Blob, createImageBitmap */

// Asynchronously parses an array buffer into an ImageBitmap - this contains the decoded data
// Supported on worker threads, not supported on Edge, IE11 and Safari
// https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap#Browser_compatibility

export default function parseToImageBitmap(arrayBuffer, options) {
  // NOTE: In some cases unnecessary conversion to blob (response, blob, file input)
  const blob = new Blob([new Uint8Array(arrayBuffer)]); // MIME type not needed...
  const imagebitmapOptions = options && options.imagebitmap;
  return imagebitmapOptions ? createImageBitmap(blob) : createImageBitmap(blob, imagebitmapOptions);
}
