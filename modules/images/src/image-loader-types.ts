// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, StrictLoaderOptions} from '@loaders.gl/core/loader-utils';
import {VERSION} from './lib/utils/version';
import {ImageBitmapFormat} from './image-format';

/**
 * Loader options for `ImageLoader`.
 */
export type ImageLoaderOptions = StrictLoaderOptions & {
  /** Bitmap-oriented image loader options. */
  image?: {
    /** Compatibility alias. `ImageLoader` only accepts `imagebitmap`. */
    type?: 'imagebitmap';
  };
  /** Pass-through options for browser `createImageBitmap()` calls. */
  imagebitmap?: ImageBitmapOptions & Record<string, unknown>;
};

const DEFAULT_IMAGE_BITMAP_LOADER_OPTIONS: ImageLoaderOptions = {
  image: {}
  // imagebitmap: {} - passes (platform dependent) parameters to ImageBitmap constructor
};

/**
 * Metadata-only loader for images as `ImageBitmap`.
 */
async function preload() {
  const {ImageLoaderWithParser} = await import('@loaders.gl/images/image-loader');
  return ImageLoaderWithParser;
}

export const ImageLoader = {
  dataType: null as unknown as ImageBitmap,
  batchType: null as never,
  ...ImageBitmapFormat,
  version: VERSION,
  options: DEFAULT_IMAGE_BITMAP_LOADER_OPTIONS,
  preload
} as const satisfies Loader<ImageBitmap, never, ImageLoaderOptions>;
