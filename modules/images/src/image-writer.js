import {encodeImage} from './lib/encoders/encode-image';

export default {
  name: 'Images',
  extensions: ['jpeg'],
  // TODO encode is broken, fix...
  encode: async (image, options) => await encodeImage(image, options.type),
  options: {
    type: 'png'
  }
};
