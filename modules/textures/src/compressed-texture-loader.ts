import type {WorkerLoaderObject, LoaderObject} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {parseCompressedTexture} from './lib/parsers/parse-compressed-texture';

/**
 * Worker Loader for KTX, DDS, and PVR texture container formats
 */
export const CompressedTextureWorkerLoader = {
  name: 'Texture Containers',
  id: 'compressed-texture',
  module: 'textures',
  version: VERSION,
  worker: true,
  extensions: [
    'ktx',
    'ktx2',
    'dds', // WEBGL_compressed_texture_s3tc, WEBGL_compressed_texture_atc
    'pvr' // WEBGL_compressed_texture_pvrtc
  ],
  mimeTypes: ['application/octet-stream', 'image/vnd-ms.dds', 'image/ktx', 'image/ktx2'],
  binary: true,
  options: {
    'compressed-texture': {
      libraryPath: 'libs/'
    }
  }
};

/**
 * Loader for KTX, DDS, and PVR texture container formats
 */
export const CompressedTextureLoader = {
  ...CompressedTextureWorkerLoader,
  parse: async (arrayBuffer, options) => parseCompressedTexture(arrayBuffer)
};

// TYPE TESTS - TODO find a better way than exporting junk
export const _TypecheckCompressedTextureWorkerLoader: WorkerLoaderObject =
  CompressedTextureWorkerLoader;
export const _TypecheckCompressedTextureLoader: LoaderObject = CompressedTextureLoader;
