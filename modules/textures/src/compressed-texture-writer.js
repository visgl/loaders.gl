import {encodeImageURLToCompressedTextureURL} from './lib/encoders/encode-texture';

export const CompressedTextureWriter = {
  name: 'Textures',
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
