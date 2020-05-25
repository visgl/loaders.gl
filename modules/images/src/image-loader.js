// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
import parseImage from './lib/parsers/parse-image';
import {getBinaryImageMetadata} from './lib/category-api/binary-image-api';

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
  // TODO: byteOffset, byteLength;
  test: arrayBuffer => Boolean(getBinaryImageMetadata(new DataView(arrayBuffer))),
  options: {
    image: {
      format: 'auto',
      decode: true // if format is HTML
    }
    // imagebitmap: {} - passes (platform dependent) parameters to ImageBitmap constructor
  }
};

export default ImageLoader;
