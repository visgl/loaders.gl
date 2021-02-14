/** @typedef {import('@loaders.gl/loader-utils').WriterObject} WriterObject */
import {VERSION} from './lib/utils/version';
import {encodeImageURLToCompressedTextureURL} from './lib/encoders/encode-texture';

/**
 * DDS Texture Container Exporter
 * @type {WriterObject}
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
