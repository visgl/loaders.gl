import parseImage from './lib/parsers/parse-image';

import {isPng, isGif, isBmp, isJpeg} from './lib/metadata/image-sniffers';

const EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'svg'];

// Loads a platform-specific image type that can be used as input data to WebGL textures
const ImageLoader = {
  name: 'Images',
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
  }
};

export default ImageLoader;
