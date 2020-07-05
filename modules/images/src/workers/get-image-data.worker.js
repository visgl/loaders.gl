/* global self, OffscreenCanvas, postMessage */
let canvas;
let context2d;

self.onmessage = function(event) {
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
    const data = imageData.data.buffer;

    const result = {width, height, data, worker: true};
    const transferList = [data];

    // the original image will be detached in the main-thread, but we can optionally "send" it back
    if (options && options.image && options.image.returnImage) {
      result.image = image;
      transferList.push(image);
    }

    // @ts-ignore
    postMessage({type: 'done', result}, [data]);
  } catch (error) {
    // @ts-ignore
    postMessage({type: 'error', message: error.message});
  }
};
