// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// TYPES
export type {ImageDataType, ImageType, ImageTypeEnum} from './types';
export type {LegacyImageLoaderOptions} from './legacy-image-loader-types';
export type {ImageLoaderOptions} from './image-loader-types';

// LOADERS AND WRITERS
export {ImageFormat, ImageBitmapFormat} from './image-format';
export {LegacyImageLoader} from './legacy-image-loader-types';
export {ImageLoader} from './image-loader-types';
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

export type {GPUTextureFormat, TextureFormat} from '@loaders.gl/core/schema';
export {
  BasisTextureFormat,
  CompressedTextureFormat,
  CrunchTextureFormat,
  DDSTextureFormat,
  KTX2BasisTextureFormat,
  NPYFormat,
  RadianceHDRFormat
} from './texture-format';
export type {BasisLoaderOptions} from './basis-loader-types';
export type {
  BasisASTCBlockSize,
  BasisCodec,
  BasisEncoderFormat,
  BasisFormat,
  BasisFormatSelection,
  BasisImageData,
  BasisSupportedTextureFeatures,
  BasisTargetFormat,
  BasisTextureInfo
} from './basis-types';
export {BasisLoader} from './basis-loader-types';
export type {CompressedTextureLoaderOptions} from './compressed-texture-loader-types';
export {CompressedTextureLoader} from './compressed-texture-loader-types';
export type {CrunchLoaderOptions} from './crunch-loader';
export {CrunchLoader} from './crunch-loader';
export type {RadianceHDRLoaderOptions} from './radiance-hdr-loader-types';
export type {RadianceHDRMetadata} from './lib/parsers/parse-hdr';
export {RadianceHDRLoader} from './radiance-hdr-loader-types';
export type {NPYLoaderOptions} from './npy-loader-types';
export {NPYLoader} from './npy-loader-types';
export type {TextureManifestLoaderOptions, TextureManifest} from './texture-loader-types';
export {TextureLoader} from './texture-loader-types';
export type {TextureArrayLoaderOptions, TextureArrayManifest} from './texture-array-loader-types';
export {TextureArrayLoader} from './texture-array-loader-types';
export type {TextureCubeLoaderOptions, TextureCubeManifest} from './texture-cube-loader-types';
export {TextureCubeLoader} from './texture-cube-loader-types';
export type {
  TextureCubeArrayLoaderOptions,
  TextureCubeArrayManifest
} from './texture-cube-array-loader-types';
export {TextureCubeArrayLoader} from './texture-cube-array-loader-types';
export type {
  CompositeImageManifest,
  ImageTextureArrayManifest,
  ImageTextureCubeArrayLayer,
  ImageTextureCubeArrayManifest,
  ImageTextureCubeFaces,
  ImageTextureCubeManifest,
  ImageTextureManifest,
  ImageTextureSource,
  ImageTextureTemplateSource
} from './texture-manifest-schema';
export type {KTX2BasisWriterOptions} from './ktx2-basis-writer';
export type {CompressedTextureLoaderOptions as TextureLoaderOptions} from './compressed-texture-loader-types';
export {BasisWorkerLoader} from './basis-loader-types';
export {CompressedTextureWorkerLoader} from './compressed-texture-loader-types';
export {NPYWorkerLoader} from './npy-loader-types';
export {CrunchLoader as CrunchWorkerLoader} from './crunch-loader';
export {VideoLoader} from './video-loader-types';
export type {VideoLoaderOptions} from './video-loader-types';
export {VideoFormat} from './video-format';
