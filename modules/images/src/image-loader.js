/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
import parseImage from './lib/parsers/parse-image';

import {isPng, isGif, isBmp, isJpeg} from './lib/binary-image-api/binary-image-parsers';

const EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'svg'];

// Loads a platform-specific image type that can be used as input data to WebGL textures
const ImageLoader = {
  name: 'Images',
  version: __VERSION__,
  extensions: EXTENSIONS,
  parse: parseImage,
  test: arrayBuffer => {
    const dataView = new DataView(arrayBuffer); // , byteOffset, byteLength);
    return isJpeg(dataView) || isBmp(dataView) || isGif(dataView) || isPng(dataView);
  },
  options: {
    images: {
      format: 'auto',
      decodeHTML: true // if format is HTML
    }
    // imagebitmap: {}
  }
};

export default ImageLoader;
