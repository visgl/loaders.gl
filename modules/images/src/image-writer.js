import {encodeImage} from './write-image/encode-image';

export default {
  name: 'Images',
  extension: 'jpeg',
  encodeToBinary: encodeImage,
  DEFAULT_OPTIONS: {
    type: 'jpeg'
  }
};
