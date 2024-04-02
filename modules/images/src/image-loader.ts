import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ImageType} from './types';
// import type { ImageType } from '@loaders.gl/schema';
import {VERSION} from './lib/utils/version';
import {parseImage} from './lib/parsers/parse-image';
import {getBinaryImageMetadata} from './lib/category-api/binary-image-api';

const EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'svg', 'avif'];
const MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/vnd.microsoft.icon',
  'image/svg+xml'
];

export type ImageLoaderOptions = LoaderOptions & {
  image?: {
    type?: 'auto' | 'data' | 'imagebitmap' | 'image';
    decode?: boolean;
  };
  imagebitmap?: ImageBitmapOptions;
};

const DEFAULT_IMAGE_LOADER_OPTIONS: ImageLoaderOptions = {
  image: {
    type: 'auto',
    decode: true // if format is HTML
  }
  // imagebitmap: {} - passes (platform dependent) parameters to ImageBitmap constructor
};

/**
 * Loads a platform-specific image type
 * Note: This type can be used as input data to WebGL texture creation
 */
export const ImageLoader = {
  dataType: null as unknown as ImageType,
  batchType: null as never,
  id: 'image',
  module: 'images',
  name: 'Images',
  version: VERSION,
  mimeTypes: MIME_TYPES,
  extensions: EXTENSIONS,
  parse: parseImage,
  // TODO: byteOffset, byteLength;
  tests: [(arrayBuffer) => Boolean(getBinaryImageMetadata(new DataView(arrayBuffer)))],
  options: DEFAULT_IMAGE_LOADER_OPTIONS
} as const satisfies LoaderWithParser<ImageType, never, ImageLoaderOptions>;
