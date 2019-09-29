import {load} from '@loaders.gl/core';
import ImageLoader from './image-loader';

export {default as ImageLoader} from './image-loader';
export {default as ImageWriter} from './image-writer';

// Parsed Image API
export {isImageTypeSupported, getSupportedImageType} from './lib/parsed-image-api/image-type';
export {
  isImage,
  getImageType,
  getImageSize,
  getImageData
} from './lib/parsed-image-api/parsed-image-api';

// Binary Image API
export {
  isBinaryImage,
  getBinaryImageMIMEType,
  getBinaryImageSize
} from './lib/binary-image-api/binary-image-api';

// EXPERIMENTAL V2.0
export {
  JPEGLoader as _JPEGLoader,
  PNGLoader as _PNGLoader,
  GIFLoader as _GIFLoader,
  BMPLoader as _BMPLoader,
  SVGLoader as _SVGLoader,
  ImageLoaders as _ImageLoaders
} from './image-loaders';

// DEPRECATED

export async function loadImage(url, options) {
  return await load(url, ImageLoader, options);
}
