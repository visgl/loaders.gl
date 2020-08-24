// Image loading/saving for browser and Node.js
/* global document, ImageBitmap, ImageData */
import {global} from '../utils/globals';
import {getImageSize} from '../category-api/parsed-image-api';

// @ts-ignore TS2339: Property does not exist on type
const {_encodeImageNode} = global;

export async function encodeImage(image, options) {
  options = options || {};
  options.image = options.image || {};

  return _encodeImageNode
    ? _encodeImageNode(image, {type: options.image.mimeType})
    : encodeImageInBrowser(image, options);
}

// In case we get exceptions from canvas.toBlob(resolve, type, quality)
let qualityParamSupported = true;

/**
 *
 * @param image
 * @param options
 * @note Based on canvas.toBlob
 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
 */
async function encodeImageInBrowser(image, options) {
  const {mimeType, jpegQuality} = options.image;

  const {width, height} = getImageSize(image);

  // create a canvas and resize it to the size of our image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  drawImageToCanvas(image, canvas);

  // The actual encoding is done asynchronously with `canvas.toBlob()`
  const blob = await new Promise((resolve, reject) => {
    // get it back as a Blob
    if (jpegQuality && qualityParamSupported) {
      try {
        canvas.toBlob(resolve, mimeType, jpegQuality);
        return;
      } catch (error) {
        qualityParamSupported = false;
      }
    }
    canvas.toBlob(resolve, mimeType);
  });

  return await blob.arrayBuffer();
}

function drawImageToCanvas(image, canvas, x = 0, y = 0) {
  // Try optimized path for ImageBitmaps via bitmaprenderer context
  if (x === 0 && y === 0 && typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
    const context = canvas.getContext('bitmaprenderer');
    if (context) {
      // transfer the ImageBitmap to it
      context.transferFromImageBitmap(image);
      return canvas;
    }
  }

  // Available on most platforms, except IE11 and Andriod WebViews...
  const context = canvas.getContext('2d');
  if (image.data) {
    // ImageData constructor expects clamped array even though getImageData does not return a clamped array...
    const clampedArray = new Uint8ClampedArray(image.data);
    const imageData = new ImageData(clampedArray, image.width, image.height);
    context.putImageData(imageData, 0, 0);
    return canvas;
  }

  // Fall back to generic image/image bitmap rendering path
  context.drawImage(image, 0, 0);
  return canvas;
}
