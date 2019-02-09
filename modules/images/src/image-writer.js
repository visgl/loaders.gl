import {nodeEncodeImage} from './node-encode-image';

export default {
  name: 'Images',
  extension: 'jpeg',
  // writeToFile: saveBinaryFile,
  // TODO - encode standard format? Encode mesh to binary?
  encodeToBinary: nodeEncodeImage,
  DEFAULT_OPTIONS: {
    type: 'jpeg'
  }
};
