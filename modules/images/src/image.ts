// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {type ImageLoaderOptions, ImageLoaderWithParser} from './image-loader';

export {type ImageWriterOptions, ImageWriter} from './image-writer';

export {ImageLoader} from './image-loader-types';

export {IMAGE_EXTENSIONS, IMAGE_MIME_TYPES, ImageFormat, ImageBitmapFormat} from './image-format';

export {default as GIFBuilder} from './gif-builder';
export type {ImageDataType} from './types';
export type {ImageType} from './types';
export type {ImageTypeEnum} from './types';
export {getBinaryImageMetadata} from './lib/category-api/binary-image-api';
export {isImageTypeSupported} from './lib/category-api/image-type';
export {getDefaultImageType} from './lib/category-api/image-type';
export {isImage} from './lib/category-api/parsed-image-api';
export {getImageType} from './lib/category-api/parsed-image-api';
export {getImageSize} from './lib/category-api/parsed-image-api';
export {getImageData} from './lib/category-api/parsed-image-api';
export {getSupportedImageFormats} from './lib/category-api/image-format';
export {isImageFormatSupported} from './lib/category-api/image-format';
export type {CompositeImageManifest} from './lib/composite-image/composite-image-manifest-schema';
