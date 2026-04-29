import type {Loader, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {ImageBitmapFormat} from './image-format';

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
  ...ImageBitmapFormat,
  version: VERSION,
  options: DEFAULT_IMAGE_BITMAP_LOADER_OPTIONS,
  preload
} as const satisfies Loader<ImageBitmap, never, ImageBitmapLoaderOptions>;
