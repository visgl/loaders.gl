/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
import {VERSION} from './lib/utils/version';
import {parseCompressedTexture} from './lib/parsers/parse-compressed-texture';

/**
 * Worker Loader for KTX, DDS, and PVR texture container formats
 * @type {WorkerLoaderObject}
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
      libraryPath: `libs/`
    }
  }
};

/**
 * Loader for KTX, DDS, and PVR texture container formats
 * @type {LoaderObject}
 */
export const CompressedTextureLoader = {
  ...CompressedTextureWorkerLoader,
  parse: async (arrayBuffer, options) => parseCompressedTexture(arrayBuffer)
};
