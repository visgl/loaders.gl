import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import parseImage from './lib/parsers/parse-image';
import {getBinaryImageMetadata} from './lib/category-api/binary-image-api';

const EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'svg'];
const MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/vnd.microsoft.icon',
  'image/svg+xml'
];

/**
 * Loads a platform-specific image type
 * Note: This type can be used as input data to WebGL texture creation
 */
export const ImageLoader = {
  id: 'image',
  module: 'images',
  name: 'Images',
  version: VERSION,
  mimeTypes: MIME_TYPES,
  extensions: EXTENSIONS,
  parse: parseImage,
  // TODO: byteOffset, byteLength;
  tests: [(arrayBuffer) => Boolean(getBinaryImageMetadata(new DataView(arrayBuffer)))],
  options: {
    image: {
      type: 'auto',
      decode: true // if format is HTML
    }
    // imagebitmap: {} - passes (platform dependent) parameters to ImageBitmap constructor
  }
};

export const _typecheckImageLoader: LoaderWithParser = ImageLoader;
