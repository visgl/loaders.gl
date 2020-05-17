// IMAGE CATEGORY API

// Parsed Image API

export {isImage, getImageType, getImageSize, getImageData} from './lib/api/parsed-image-api';

// Texture Loading API
export {loadImage} from './lib/texture-loading-api/load-image';
export {loadImageArray} from './lib/texture-loading-api/load-image-array';
export {loadImageCube} from './lib/texture-loading-api/load-image-cube';

// BACKWARDS COMPATIBILITY (images module used to contain these)
export {ImageLoader, ImageWriter} from '@loaders.gl/image';
export {getBinaryImageMetadata} from '@loaders.gl/image';
export {isImageTypeSupported, getDefaultImageType} from '@loaders.gl/image';

// DEPRECATED

// Binary Image API
export {
  isBinaryImage,
  getBinaryImageMIMEType,
  getBinaryImageSize
} from './lib/api/binary-image-api';

export {ImageLoader as HTMLImageLoader} from '@loaders.gl/image';

import {getDefaultImageType} from '@loaders.gl/image';

export function getSupportedImageType(imageType = null) {
  return getDefaultImageType();
}
