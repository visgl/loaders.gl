export {default as ImageLoader} from './image-loader';
export {default as ImageWriter} from './image-writer';

// IMAGE CATEGORY API

// Binary Image API
export {getBinaryImageMetadata} from './lib/api/binary-image-api';

// HACK - for texture loaders in image category
export {default as _parseImage} from './lib/parsers/parse-image';

// DEPRECATED

export {
  isBinaryImage,
  getBinaryImageMIMEType,
  getBinaryImageSize
} from './lib/deprecated/binary-image-api-deprecated';

export {isImageTypeSupported, getDefaultImageType} from './lib/utils/image-type';

export {default as HTMLImageLoader} from './image-loader';
