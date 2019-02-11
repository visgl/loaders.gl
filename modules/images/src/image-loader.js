import {loadImage} from './load-image/load-image';

/*
/* global Image, Blob, createImageBitmap *

// Specifically loads an ImageBitmap (works on newer browser main and worker threads)
export const ImageBitmapLoader = {
  parse: parseToImageBitmap
};

// Specifically loads an HTMLImage (works on alls browser main threads but not on worker threads)
export const HTMLImageLoader = {
  load: loadToHTMLImage
};

// Loads a platform-specific image type that can be used as input data to WebGL textures
export const PlatformImageLoader = {
  parse: parseToPlatformImage,
  load: loadToPlatformImage
};
*/

export default {
  name: 'Images',
  extension: [],
  loadAndParse: loadImage
};
