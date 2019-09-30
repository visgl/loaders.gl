import {load} from '@loaders.gl/core';
import ImageLoader from './image-loader';

export {default as ImageLoader} from './image-loader';
export {default as ImageWriter} from './image-writer';

// EXPERIMENTAL V2.0
export {
  JPEGLoader as _JPEGLoader,
  PNGLoader as _PNGLoader,
  GIFLoader as _GIFLoader,
  BMPLoader as _BMPLoader,
  SVGLoader as _SVGLoader,
  ImageLoaders as _ImageLoaders
} from './image-loaders';

export {getImageSize as _getImageSize} from './lib/accessors/image-accessors';

// UTILS
export {
  isImage,
  getImageMetadata,
  getImageMIMEType,
  getImageSize
} from './lib/metadata/get-image-metadata';

// DEPRECATED

export async function loadImage(url, options) {
  return await load(url, ImageLoader, options);
}
