export {default as ImageLoader} from './image-loader';
export {default as ImageWriter} from './image-writer';

// IMAGE CATEGORY API

// Parsed Image API
export {isImageTypeSupported, getDefaultImageType} from './lib/parsed-image-api/image-type';

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

// Texture Loading API
export {loadImage} from './lib/texture-loading-api/load-image';
export {loadImageArray} from './lib/texture-loading-api/load-image-array';
export {loadImageCube} from './lib/texture-loading-api/load-image-cube';

// DEPRECATED
export {default as HTMLImageLoader} from './image-loader';

import {getDefaultImageType} from './lib/parsed-image-api/image-type';

export function getSupportedImageType(imageType = null) {
  return getDefaultImageType();
}
