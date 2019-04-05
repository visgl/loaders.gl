import {
  canParseImage,
  parseImage,
  loadImage,
  parseToImageBitmap,
  loadToHTMLImage
} from './lib/parse-image';

// Loads a platform-specific image type that can be used as input data to WebGL textures
export default {
  name: 'Images',
  extension: [],
  parse: canParseImage && parseImage,
  loadAndParse: !canParseImage && loadImage
};

// EXPERIMENTAL

// Specifically loads an ImageBitmap (works on newer browsers, on both main and worker threads)
export const ImageBitmapLoader = {
  parse: parseToImageBitmap
};

// Specifically loads an HTMLImage (works on all browsers' main thread but not on worker threads)
export const HTMLImageLoader = {
  loadAndParse: loadToHTMLImage
};
