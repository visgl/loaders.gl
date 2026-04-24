// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {BasisLoaderOptions} from './basis-loader-with-parser';
export {
  BasisLoaderWithParser as BasisLoader,
  BasisWorkerLoaderWithParser as BasisWorkerLoader
} from './basis-loader-with-parser';

export type {CompressedTextureLoaderOptions} from './compressed-texture-loader-with-parser';
export {
  CompressedTextureLoaderWithParser as CompressedTextureLoader,
  CompressedTextureWorkerLoaderWithParser as CompressedTextureWorkerLoader
} from './compressed-texture-loader-with-parser';

export type {RadianceHDRLoaderOptions} from './radiance-hdr-loader-with-parser';
export {RadianceHDRLoaderWithParser as RadianceHDRLoader} from './radiance-hdr-loader-with-parser';

export type {NPYLoaderOptions} from './npy-loader-with-parser';
export {
  NPYLoaderWithParser as NPYLoader,
  NPYWorkerLoaderWithParser as NPYWorkerLoader
} from './npy-loader-with-parser';

export type {TextureManifestLoaderOptions, TextureManifest} from './texture-loader-with-parser';
export {TextureLoaderWithParser as TextureLoader} from './texture-loader-with-parser';
export type {
  TextureArrayLoaderOptions,
  TextureArrayManifest
} from './texture-array-loader-with-parser';
export {TextureArrayLoaderWithParser as TextureArrayLoader} from './texture-array-loader-with-parser';
export type {
  TextureCubeLoaderOptions,
  TextureCubeManifest
} from './texture-cube-loader-with-parser';
export {TextureCubeLoaderWithParser as TextureCubeLoader} from './texture-cube-loader-with-parser';
export type {
  TextureCubeArrayLoaderOptions,
  TextureCubeArrayManifest
} from './texture-cube-array-loader-with-parser';
export {TextureCubeArrayLoaderWithParser as TextureCubeArrayLoader} from './texture-cube-array-loader-with-parser';
