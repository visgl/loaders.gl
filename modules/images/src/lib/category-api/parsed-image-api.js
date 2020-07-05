/* global document, Image, ImageBitmap */
import runWorker from './run-worker';

export function isImage(image) {
  return Boolean(getImageTypeOrNull(image));
}

export function getImageType(image) {
  const format = getImageTypeOrNull(image);
  if (!format) {
    throw new Error('Not an image');
  }
  return format;
}

export function getImageSize(image) {
  return getImageType(image) === 'image'
    ? {width: image.naturalWidth, height: image.naturalHeight}
    : {width: image.width, height: image.height};
}

// PRIVATE

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

// MAIN THREAD IMAGE EXTRACTION

let canvas;
let context2d;

export function getImageData(image, options = {}) {
  let imageData;
  switch (getImageType(image)) {
    case 'image':
    case 'imagebitmap':
    // @ts-ignore DEPRECATED Backwards compatibility
    case 'html': // eslint-disable-line no-fallthrough
      canvas = canvas || document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      context2d = context2d || canvas.getContext('2d');
      context2d.drawImage(image, 0, 0);
      imageData = context2d.getImageData(0, 0, image.width, image.height);
      // if (options.includeImage) {
      //   imageData.image = image;
      // }
      return imageData;

    case 'data':
    default:
      return image;
  }
}

// WORKER BASED IMAGE EXTRACTION

const WORKER_SCRIPT = `
let canvas;
let context2d;
onmessage = function(event) {
  try {
    const {image, options} = event.data;
    // TODO - can we reuse and resize instead of creating new canvas for each image?
    canvas = canvas || new OffscreenCanvas(image.width, image.height);
    // TODO potentially more efficient, but seems to block 2D context creation?
    // const bmContext = canvas.getContext('bitmaprenderer');
    // bmContext.transferFromImageBitmap(image);
    context2d = context2d || canvas.getContext('2d');
    context2d.drawImage(image, 0, 0);
    const imageData = context2d.getImageData(0, 0, image.width, image.height);
    const {width, height} = imageData;

    // Uint8Array cannot be transferred, so unwrap the underlying ArrayBuffer
    let data = imageData.data.buffer;

    const result = {width, height, data, worker: true};
    const transferList = [data];

    // the original image will be detached in the main-thread, but we can optionally "send" it back
    if (options && options.includeImage) {
      result.image = image;
      transferList.push(image);
    }

    postMessage({type: 'done', result}, [data]);
  } catch (error) {
    postMessage({type: 'error', message: error.message});
  }
}
`;

let workerDisabled = false;

export async function getImageDataAsync(image, options) {
  if (!workerDisabled && typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
    try {
      const imageData = await runWorker(WORKER_SCRIPT, 'getImageAsync', {image, options});
      // Uint8Array cannot be transferred, so rewrap the underlying ArrayBuffer
      imageData.data = new Uint8Array(imageData.data);
      return imageData;
    } catch (error) {
      // eslint-disable-next-line
      console.error(`disabling worker due to error: ${error}`);
      workerDisabled = true;
    }
  }
  return getImageData(image);
}
