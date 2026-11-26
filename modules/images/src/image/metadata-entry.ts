// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {ImageLoader} from '../image-loader-types';
export {ImageFormat} from '../image-format';
export {ImageBitmapFormat} from '../image-format';
export type {ImageLoaderOptions} from '../image-loader-types';
export type {ImageLoaderWithParser} from '../image-loader';
export type {ImageWriterOptions} from '../image-writer';
export type {IMAGE_EXTENSIONS, IMAGE_MIME_TYPES} from '../image-format';
export type {default as GIFBuilder} from '../gif-builder';
export type {ImageDataType, ImageType, ImageTypeEnum} from '../types';
export type {getBinaryImageMetadata} from '../lib/category-api/binary-image-api';
export type {isImageTypeSupported, getDefaultImageType} from '../lib/category-api/image-type';
export type {
  isImage,
  getImageType,
  getImageSize,
  getImageData
} from '../lib/category-api/parsed-image-api';
export type {
  getSupportedImageFormats,
  isImageFormatSupported
} from '../lib/category-api/image-format';
export type {CompositeImageManifest} from '../lib/composite-image/composite-image-manifest-schema';
export {ImageWriter} from '../image-writer-types';
