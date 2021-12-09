import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {parseCompressedTexture} from './lib/parsers/parse-compressed-texture';
import parseBasis from './lib/parsers/parse-basis';

export type TextureLoaderOptions = {
  'compressed-texture'?: {
    libraryPath?: string;
    useBasis?: boolean;
  };
};

const DEFAULT_TEXTURE_LOADER_OPTIONS = {
  'compressed-texture': {
    libraryPath: 'libs/',
    useBasis: false
  }
};

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
  mimeTypes: [
    'image/ktx2',
    'image/ktx',
    'image/vnd-ms.dds',
    'image/x-dds',
    'application/octet-stream'
  ],
  binary: true,
  options: DEFAULT_TEXTURE_LOADER_OPTIONS
};

/**
 * Loader for KTX, DDS, and PVR texture container formats
 */
export const CompressedTextureLoader = {
  ...CompressedTextureWorkerLoader,
  parse: async (arrayBuffer, options) => {
    if (options['compressed-texture'].useBasis) {
      options.basis = {
        format: {
          alpha: 'BC3',
          noAlpha: 'BC1'
        },
        ...options.basis,
        containerFormat: 'ktx2',
        module: 'encoder'
      };
      return (await parseBasis(arrayBuffer, options))[0];
    }
    return parseCompressedTexture(arrayBuffer);
  }
};

// TYPE TESTS - TODO find a better way than exporting junk
export const _TypecheckCompressedTextureWorkerLoader: Loader = CompressedTextureWorkerLoader;
export const _TypecheckCompressedTextureLoader: LoaderWithParser = CompressedTextureLoader;
