import type {Loader, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
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
 * Metadata-only loader for images as `ImageBitmap`.
 */
async function preload() {
  const {ImageBitmapLoaderWithParser} = await import('./image-bitmap-loader-with-parser');
  return ImageBitmapLoaderWithParser;
}

export const ImageBitmapLoader = {
  dataType: null as unknown as ImageBitmap,
  batchType: null as never,
  id: 'imagebitmap',
  module: 'images',
  name: 'ImageBitmap',
  version: VERSION,
  mimeTypes: MIME_TYPES,
  extensions: EXTENSIONS,
  tests: [arrayBuffer => Boolean(getBinaryImageMetadata(new DataView(arrayBuffer)))],
  options: DEFAULT_IMAGE_BITMAP_LOADER_OPTIONS,
  preload
} as const satisfies Loader<ImageBitmap, never, ImageBitmapLoaderOptions>;
