import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ImageType} from './types';
// import type { ImageType } from '@loaders.gl/schema';
import {parseImage} from './lib/parsers/parse-image';
import {getBinaryImageMetadata} from './lib/category-api/binary-image-api';
import {VERSION} from './lib/utils/version';

export type ImageLoaderOptions = LoaderOptions & {
  image?: {
    /** Which image representation to load into. imagebitmap is default in browser, data in Node. */
    shape?: 'auto' | 'data' | 'imagebitmap' | 'htmlimage';
    /** Whether to pre-decode the image */
    decode?: boolean;
    /** @deprecated v4.0: Use options.shape */
    type?: 'auto' | 'data' | 'imagebitmap' | 'image';
  };
  imageBitmap?: ImageBitmapOptions;
  imagebitmap?: ImageBitmapOptions;
};

/**
 * Loads a platform-specific image type
 * Note: This type can be used as input data to WebGL texture creation
 */
export const ImageLoader: LoaderWithParser<ImageType, never, ImageLoaderOptions> = {
  id: 'image',
  module: 'images',
  name: 'Images',
  version: VERSION,
  mimeTypes: [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/avif',
    'image/bmp',
    'image/vnd.microsoft.icon',
    'image/svg+xml'
  ],
  extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'svg', 'avif'],
  parse: parseImage,
  // TODO: byteOffset, byteLength;
  tests: [(arrayBuffer: ArrayBuffer) => Boolean(getBinaryImageMetadata(new DataView(arrayBuffer)))],
  options: {
    image: {
      shape: 'auto',
      decode: true // if format is HTML
    }
    // imagebitmap: {} - passes (platform dependent) parameters to ImageBitmap constructor
  }
};
