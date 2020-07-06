import {encodeImage} from './lib/encoders/encode-image';

export default {
  name: 'Images',
  extensions: ['jpeg'],
  options: {
    image: {
      mimeType: 'image/png',
      jpegQuality: null
    }
  },
  encode: encodeImage
};
