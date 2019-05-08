"use strict";module.export({parseImage:()=>parseImage,loadImage:()=>loadImage,parseToImageBitmap:()=>parseToImageBitmap,loadToHTMLImage:()=>loadToHTMLImage});module.export({canParseImage:()=>canParseImage},true);var parseImageNode;module.link('../node/parse-image-node',{parseImageNode(v){parseImageNode=v}},0);/* global Image, Blob, createImageBitmap, btoa, fetch */


const canParseImage = parseImageNode || typeof ImageBitmap !== 'undefined';

// Parse to platform defined type (ndarray on node, ImageBitmap on browser)
function parseImage(arrayBuffer, options) {
  if (parseImageNode) {
    return parseImageNode(arrayBuffer, options);
  }

  return parseToImageBitmap(arrayBuffer);
}

// Fallback for older browsers
// TODO - investigate Image.decode()
// https://medium.com/dailyjs/image-loading-with-image-decode-b03652e7d2d2
async function loadImage(url, options) {
  if (typeof Image === 'undefined') {
    const response = await fetch(url, options);
    const arrayBuffer = await response.arrayBuffer();
    return parseImage(arrayBuffer);
  }
  return await loadToHTMLImage(url, options);
}

// Asynchronously parses an array buffer into an ImageBitmap - this contains the decoded data
// Supported on worker threads
// Not supported on Edge and Safari
// https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap#Browser_compatibility
function parseToImageBitmap(arrayBuffer) {
  if (typeof createImageBitmap === 'undefined') {
    throw new Error('parseImage');
  }

  const blob = new Blob([new Uint8Array(arrayBuffer)]);
  return createImageBitmap(blob);
}

//
async function loadToHTMLImage(url, options) {
  let src;
  if (/\.svg((\?|#).*)?$/.test(url)) {
    // is SVG
    const response = await fetch(url, options);
    const xml = await response.text();
    // base64 encoding is safer. utf-8 fails in some browsers
    src = `data:image/svg+xml;base64,${btoa(xml)}`;
  } else {
    src = await url;
  }

  return await new Promise((resolve, reject) => {
    try {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = err => reject(new Error(`Could not load image ${url}: ${err}`));
      image.crossOrigin = (options && options.crossOrigin) || 'anonymous';
      image.src = src;
    } catch (error) {
      reject(error);
    }
  });
}
