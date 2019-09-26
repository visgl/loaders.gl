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

// DEPRECATED

// Specifically loads an ImageBitmap (works on newer browsers, on both main and worker threads)
export const ImageBitmapLoader = {
  ...ImageLoader,
  options: {
    images: {
      format: 'imagebitmap'
    }
  }
};

// Specifically loads an HTMLImage (works on all browsers' main thread but not on worker threads)
export const HTMLImageLoader = {
  ...ImageLoader,
  options: {
    images: {
      format: 'html',
      decodeHTML: true
    }
  }
};
