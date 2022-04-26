import {isBrowser} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';

// Types
export type {GPUTextureFormat} from '@loaders.gl/schema';
export type {TextureLoaderOptions} from './compressed-texture-loader';

// Loaders
export {BasisLoader, BasisWorkerLoader} from './basis-loader';
export {CompressedTextureLoader, CompressedTextureWorkerLoader} from './compressed-texture-loader';
export {CrunchLoader} from './crunch-loader';
export {NPYLoader, NPYWorkerLoader} from './npy-loader';

// Writers
export {CompressedTextureWriter} from './compressed-texture-writer';
export {KTX2BasisWriter} from './ktx2-basis-writer';

export const KTX2BasisWriterWorker = {
  name: 'Basis Universal Supercompressed GPU Texture',
  id: isBrowser ? 'ktx2-basis-writer' : 'ktx2-basis-writer-nodejs',
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
export {GL_EXTENSIONS_CONSTANTS} from './lib/gl-extensions';
export {selectSupportedBasisFormat} from './lib/parsers/parse-basis';
export {getSupportedGPUTextureFormats} from './lib/utils/texture-formats';

// DEPRECATED
export {CrunchLoader as CrunchWorkerLoader} from './crunch-loader';
