// import type {Writer} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {encodeImage} from './lib/encoders/encode-image';

export const ImageWriter = {
  name: 'Images',
  id: 'image',
  module: 'images',
  version: VERSION,
  extensions: ['jpeg'],
  options: {
    image: {
      mimeType: 'image/png',
      jpegQuality: null
    }
  },
  encode: encodeImage
};
