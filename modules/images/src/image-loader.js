// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
import parseImage from './lib/parsers/parse-image';
import {isPng, isGif, isBmp, isJpeg} from './lib/binary-image-api/binary-image-parsers';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'svg'];
const MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/vndmicrosofticon',
  'image/svg+xml'
];

// Loads a platform-specific image type that can be used as input data to WebGL textures
const ImageLoader = {
  name: 'Images',
  version: VERSION,
  mimeTypes: MIME_TYPES,
  extensions: EXTENSIONS,
  parse: parseImage,
  test: arrayBuffer => {
    const dataView = new DataView(arrayBuffer); // , byteOffset, byteLength);
    return isJpeg(dataView) || isBmp(dataView) || isGif(dataView) || isPng(dataView);
  },
  options: {
    image: {
      format: 'auto',
      decode: true // if format is HTML
    }
    // imagebitmap: {} - passes (platform dependent) parameters to ImageBitmap constructor
  }
};

export default ImageLoader;
