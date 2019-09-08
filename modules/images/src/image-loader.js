/* global Image */
import {
  canParseImage,
  parseImage,
  parseToImageBitmap,
  loadToHTMLImage
} from './lib/parsers/parse-to-image-bitmap';

// TODO - we don't have tests for all of these. Many are not supported on node...
const EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'svg'];

// Loads a platform-specific image type that can be used as input data to WebGL textures
export default {
  id: 'image',
  name: 'Images',
  extensions: EXTENSIONS,
  parse: canParseImage && parseImage,
  loadAndParse: typeof Image !== 'undefined' && loadToHTMLImage,
  options: {}
};

// EXPERIMENTAL

// Specifically loads an ImageBitmap (works on newer browsers, on both main and worker threads)
export const ImageBitmapLoader = {
  extensions: EXTENSIONS,
  parse: parseToImageBitmap
};
