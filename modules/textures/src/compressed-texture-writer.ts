import type {Writer, WriterOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {encodeImageURLToCompressedTextureURL} from './lib/encoders/encode-texture';

export type CompressedTextureWriterOptions = WriterOptions & {
  cwd?: string;
  texture?: {
    format: string;
    compression: string;
    quality: string;
    mipmap: boolean;
    flipY: boolean;
    toolFlags: string;
  };
};

/**
 * DDS Texture Container Exporter
 */
export const CompressedTextureWriter = {
  name: 'DDS Texture Container',
  id: 'dds',
  module: 'textures',
  version: VERSION,

  extensions: ['dds'],

  options: {
    texture: {
      format: 'auto',
      compression: 'auto',
      quality: 'auto',
      mipmap: false,
      flipY: false,
      toolFlags: ''
    }
  },

  encodeURLtoURL: encodeImageURLToCompressedTextureURL
};

// TYPE TESTS - TODO find a better way than exporting junk
export const _TypecheckCompressedTextureWriter: Writer & {
  encodeURLtoURL: (
    inputUrl: string,
    outputUrl: string,
    options?: CompressedTextureWriterOptions
  ) => Promise<string>;
} = CompressedTextureWriter;
