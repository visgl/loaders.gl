// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {VERSION} from './lib/utils/version';

// Types
export type {GPUTextureFormat, TextureFormat} from '@loaders.gl/schema';

// Loaders
export type {BasisLoaderOptions} from './basis-loader';
export {BasisLoader, BasisWorkerLoader} from './basis-loader';

export type {CompressedTextureLoaderOptions} from './compressed-texture-loader';
export {CompressedTextureLoader, CompressedTextureWorkerLoader} from './compressed-texture-loader';

export type {CrunchLoaderOptions} from './crunch-loader';
export {CrunchLoader} from './crunch-loader';

export type {NPYLoaderOptions} from './npy-loader';
export {NPYLoader, NPYWorkerLoader} from './npy-loader';

export type {ImageTextureLoaderOptions, ImageTextureManifest} from './image-texture-loader';
export {ImageTextureLoader} from './image-texture-loader';

export type {ImageTextureArrayLoaderOptions, ImageTextureArrayManifest} from './image-texture-array-loader';
export {ImageTextureArrayLoader} from './image-texture-array-loader';

export type {ImageTextureCubeLoaderOptions, ImageTextureCubeManifest} from './image-texture-cube-loader';
export {ImageTextureCubeLoader} from './image-texture-cube-loader';

export type {
  ImageTextureCubeArrayLoaderOptions,
  ImageTextureCubeArrayManifest
} from './image-texture-cube-array-loader';
export {ImageTextureCubeArrayLoader} from './image-texture-cube-array-loader';

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

// DEPRECATED
// @deprecated
export {CrunchLoader as CrunchWorkerLoader} from './crunch-loader';
// @deprecated
export type {CompressedTextureLoaderOptions as TextureLoaderOptions} from './compressed-texture-loader';
