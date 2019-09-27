import {encodeImage} from './lib/encoders/encode-image';

export default {
  name: 'Images',
  extensions: ['jpeg'],
  encode: encodeImage,
  DEFAULT_OPTIONS: {
    type: 'png'
  }
};
