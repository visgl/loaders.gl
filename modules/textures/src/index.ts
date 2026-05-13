// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {VERSION} from './lib/utils/version';

// Types
export type {GPUTextureFormat, TextureFormat} from '@loaders.gl/schema';

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

// Module constants
export {BASIS_EXTERNAL_LIBRARIES} from './lib/parsers/basis-module-loader';
export {CRUNCH_EXTERNAL_LIBRARIES} from './lib/parsers/crunch-module-loader';

// Writers
export {CompressedTextureWriter} from './compressed-texture-writer';
export {KTX2BasisWriter} from './ktx2-basis-writer';

export const KTX2BasisWriterWorker = {
  name: 'Basis Universal Supercompressed GPU Texture',
  id: 'ktx2-basis-writer',
  module: 'textures',
  version: VERSION,
  extensions: ['ktx2'],
  worker: true,
  options: {
    useSRGB: false,
    qualityLevel: 10,
    encodeUASTC: false,
    mipmaps: false
  }
};

// Texture Loading API
export {loadImageTexture} from './lib/texture-api/load-image';
export {loadImageTextureArray} from './lib/texture-api/load-image-array';
export {loadImageTextureCube} from './lib/texture-api/load-image-cube';

// Utilities
export * from './lib/gl-extensions';

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
