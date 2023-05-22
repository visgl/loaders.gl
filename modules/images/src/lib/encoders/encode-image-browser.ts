import type {ImageDataType} from '../../types';
import type {EncodeImageOptions} from './encode-image';
import {getImageSize} from '../category-api/parsed-image-api';

// In case we get exceptions from canvas.toBlob(resolve, type, quality)
let qualityParamSupported = true;

/**
 *
 * @param image
 * @param options
 * @note Based on canvas.toBlob
 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
 */
export async function encodeImageBrowser(image: ImageDataType, options?: EncodeImageOptions) {
  const quality = options?.quality;
  const mimeType = options?.mimeType || 'image/png';

  // create a canvas and resize it to the size of our image
  const {width, height} = getImageSize(image);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  // draw the image to the canvas
  drawImageToCanvas(image, canvas);

  // The actual encoding is done asynchronously with `canvas.toBlob()`
  const blob = await new Promise<Blob | null>((resolve) => {
    // get it back as a Blob
    if (quality && qualityParamSupported) {
      try {
        canvas.toBlob(resolve, mimeType, quality);
        return;
      } catch (error) {
        qualityParamSupported = false;
      }
    }
    canvas.toBlob(resolve, mimeType);
  });

  if (!blob) {
    throw new Error('image encoding failed');
  }

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
