// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {VERSION} from './lib/utils/version';

// Types
export type {GPUTextureFormat, TextureFormat} from '@loaders.gl/core/schema';

// Loaders
export {
  BasisTextureFormat,
  CompressedTextureFormat,
  CrunchTextureFormat,
  DDSTextureFormat,
  KTX2BasisTextureFormat,
  NPYFormat,
  RadianceHDRFormat
} from './texture-format';

export type {BasisLoaderOptions} from './basis-loader';
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
export {BasisLoader} from './basis-loader';

export type {CompressedTextureLoaderOptions} from './compressed-texture-loader';
export {CompressedTextureLoader} from './compressed-texture-loader';

export type {CrunchLoaderOptions} from './crunch-loader';
export {CrunchLoader} from './crunch-loader';

export type {RadianceHDRLoaderOptions} from './radiance-hdr-loader';
export type {RadianceHDRMetadata} from './lib/parsers/parse-hdr';
export {RadianceHDRLoader} from './radiance-hdr-loader';

export type {NPYLoaderOptions} from './npy-loader';
export {NPYLoader} from './npy-loader';

export type {TextureManifestLoaderOptions, TextureManifest} from './texture-loader';
export {TextureLoader} from './texture-loader';

export type {TextureArrayLoaderOptions, TextureArrayManifest} from './texture-array-loader';
export {TextureArrayLoader} from './texture-array-loader';

export type {TextureCubeLoaderOptions, TextureCubeManifest} from './texture-cube-loader';
export {TextureCubeLoader} from './texture-cube-loader';

export type {
  TextureCubeArrayLoaderOptions,
  TextureCubeArrayManifest
} from './texture-cube-array-loader';
export {TextureCubeArrayLoader} from './texture-cube-array-loader';

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

// Module constants
export {BASIS_EXTERNAL_LIBRARIES} from './lib/parsers/basis-module-loader';
export {CRUNCH_EXTERNAL_LIBRARIES} from './lib/parsers/crunch-module-loader';

// Basis format selection
export {getSupportedBasisFormats, selectSupportedBasisFormat} from './lib/utils/basis-format-utils';

// Writers
export {CompressedTextureWriter} from './compressed-texture-writer';
export type {KTX2BasisWriterOptions} from './ktx2-basis-writer';
export {KTX2BasisWriter} from './ktx2-basis-writer';

export const KTX2BasisWriterWorker = {
  name: 'Basis Universal Supercompressed GPU Texture',
  id: 'ktx2-basis-writer',
  module: 'textures',
  version: VERSION,
  extensions: ['ktx2'],
  worker: true,
  /** Published CommonJS bundle for Node.js workers. */
  workerNode: 'ktx2-basis-writer-worker-node.cjs',
  options: {
    ['ktx2-basis-writer']: {
      format: 'etc1s',
      contentType: 'linear',
      mipmaps: false,
      zstd: false,
      ldrToHdrNitMultiplier: 100
    }
  }
};

// Texture Loading API
export {loadImageTexture} from './lib/texture-api/load-image';
export {loadImageTextureArray} from './lib/texture-api/load-image-array';
export {loadImageTextureCube} from './lib/texture-api/load-image-cube';

// Utilities
export {
  GL_RGB,
  GL_RGBA,
  GL_RGBA4,
  GL_RGB5_A1,
  GL_RGBA8,
  GL_SRGB8_ALPHA8,
  GL_RGB565,
  GL_RGBA16F,
  GL_RGBA32F,
  GL_RGB9_E5,
  GL_COMPRESSED_RGB_S3TC_DXT1_EXT,
  GL_COMPRESSED_RGBA_S3TC_DXT1_EXT,
  GL_COMPRESSED_RGBA_S3TC_DXT3_EXT,
  GL_COMPRESSED_RGBA_S3TC_DXT5_EXT,
  GL_COMPRESSED_R11_EAC,
  GL_COMPRESSED_SIGNED_R11_EAC,
  GL_COMPRESSED_RG11_EAC,
  GL_COMPRESSED_SIGNED_RG11_EAC,
  GL_COMPRESSED_RGB8_ETC2,
  GL_COMPRESSED_RGBA8_ETC2_EAC,
  GL_COMPRESSED_SRGB8_ETC2,
  GL_COMPRESSED_SRGB8_ALPHA8_ETC2_EAC,
  GL_COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2,
  GL_COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2,
  GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
  GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG,
  GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
  GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG,
  GL_COMPRESSED_RGB_ETC1_WEBGL,
  GL_COMPRESSED_RGB_ATC_WEBGL,
  GL_COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL,
  GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL,
  GL_COMPRESSED_RGBA_ASTC_4x4_KHR,
  GL_COMPRESSED_RGBA_ASTC_5x4_KHR,
  GL_COMPRESSED_RGBA_ASTC_5x5_KHR,
  GL_COMPRESSED_RGBA_ASTC_6x5_KHR,
  GL_COMPRESSED_RGBA_ASTC_6x6_KHR,
  GL_COMPRESSED_RGBA_ASTC_8x5_KHR,
  GL_COMPRESSED_RGBA_ASTC_8x6_KHR,
  GL_COMPRESSED_RGBA_ASTC_8x8_KHR,
  GL_COMPRESSED_RGBA_ASTC_10x5_KHR,
  GL_COMPRESSED_RGBA_ASTC_10x6_KHR,
  GL_COMPRESSED_RGBA_ASTC_10x8_KHR,
  GL_COMPRESSED_RGBA_ASTC_10x10_KHR,
  GL_COMPRESSED_RGBA_ASTC_12x10_KHR,
  GL_COMPRESSED_RGBA_ASTC_12x12_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR,
  GL_COMPRESSED_RED_RGTC1_EXT,
  GL_COMPRESSED_SIGNED_RED_RGTC1_EXT,
  GL_COMPRESSED_RED_GREEN_RGTC2_EXT,
  GL_COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT,
  GL_COMPRESSED_RGBA_BPTC_UNORM_EXT,
  GL_COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT,
  GL_COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT,
  GL_COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT,
  GL_COMPRESSED_SRGB_S3TC_DXT1_EXT,
  GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT,
  GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT,
  GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT,
  GL_EXTENSIONS_CONSTANTS
} from './lib/gl-extensions';

// DEPRECATED EXPORTS
/** @deprecated Use CompressedTextureLoaderOptions. */
export type {CompressedTextureLoaderOptions as TextureLoaderOptions} from './compressed-texture-loader';
/** @deprecated Use BasisLoader. */
export {BasisWorkerLoader} from './basis-loader';
/** @deprecated Use CompressedTextureLoader. */
export {CompressedTextureWorkerLoader} from './compressed-texture-loader';
/** @deprecated Use NPYLoader. */
export {NPYWorkerLoader} from './npy-loader';
/** @deprecated Use CrunchLoader. */
export {CrunchLoader as CrunchWorkerLoader} from './crunch-loader';
