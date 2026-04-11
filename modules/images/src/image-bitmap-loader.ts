import type {LoaderWithParser, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {parseImageBitmap} from './lib/parsers/parse-image-bitmap';
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

/**
 * Loader options for `ImageBitmapLoader`.
 */
export type ImageBitmapLoaderOptions = StrictLoaderOptions & {
  /** Bitmap-oriented image loader options. */
  image?: {
    /** Compatibility alias. `ImageBitmapLoader` only accepts `imagebitmap`. */
    type?: 'imagebitmap';
  };
  /** Pass-through options for browser `createImageBitmap()` calls. */
  imagebitmap?: ImageBitmapOptions & Record<string, unknown>;
};

const DEFAULT_IMAGE_BITMAP_LOADER_OPTIONS: ImageBitmapLoaderOptions = {
  image: {}
  // imagebitmap: {} - passes (platform dependent) parameters to ImageBitmap constructor
};

/**
 * Loads images as `ImageBitmap` in browsers and in Node.js when `@loaders.gl/polyfills` is installed.
 */
export const ImageBitmapLoader = {
  dataType: null as unknown as ImageBitmap,
  batchType: null as never,
  id: 'imagebitmap',
  module: 'images',
  name: 'ImageBitmap',
  version: VERSION,
  mimeTypes: MIME_TYPES,
  extensions: EXTENSIONS,
  parse: parseImageBitmap,
  tests: [arrayBuffer => Boolean(getBinaryImageMetadata(new DataView(arrayBuffer)))],
  options: DEFAULT_IMAGE_BITMAP_LOADER_OPTIONS
} as const satisfies LoaderWithParser<ImageBitmap, never, ImageBitmapLoaderOptions>;
