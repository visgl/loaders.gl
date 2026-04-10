// TYPES
export type {ImageDataType, ImageType, ImageTypeEnum} from './types';
export type {ImageLoaderOptions} from './image-loader';

// LOADERS AND WRITERS
export {ImageLoader} from './image-loader';
export {ImageWriter} from './image-writer';

// IMAGE CATEGORY API

// Binary Image API
export {getBinaryImageMetadata} from './lib/category-api/binary-image-api';

// Parsed Image API
export {isImageTypeSupported, getDefaultImageType} from './lib/category-api/image-type';

export {
  isImage,
  getImageType,
  getImageSize,
  getImageData
} from './lib/category-api/parsed-image-api';

// EXPERIMENTAL
export {getSupportedImageFormats} from './lib/category-api/image-format';
export {isImageFormatSupported} from './lib/category-api/image-format';

// REMOVED
/** @deprecated Temporary placeholder to prevent builds from breaking */
export function loadImage() {
  throw new Error('loadImage has moved to @loaders.gl/textures');
}
