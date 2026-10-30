// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, StrictLoaderOptions} from '@loaders.gl/core/loader-utils';
import type {ImageType} from './types';
import {VERSION} from './lib/utils/version';
import {ImageFormat} from './image-format';

/**
 * @deprecated in v4.4. Use `ImageLoaderOptions` for new code.
 */
export type LegacyImageLoaderOptions = StrictLoaderOptions & {
  image?: {
    type?: 'auto' | 'data' | 'imagebitmap' | 'image';
    decode?: boolean;
  };
  imagebitmap?: ImageBitmapOptions & Record<string, unknown>;
};

const DEFAULT_IMAGE_LOADER_OPTIONS: LegacyImageLoaderOptions = {
  image: {
    type: 'auto',
    decode: true
  }
  // imagebitmap: {} - passes (platform dependent) parameters to ImageBitmap constructor
};

/**
 * @deprecated in v4.4. Use `ImageLoader` for a pure `ImageBitmap` return type.
 *
 * Metadata-only loader for platform-specific image types.
 */
async function preload() {
  const {LegacyImageLoaderWithParser} = await import('@loaders.gl/images/legacy-image-loader');
  return LegacyImageLoaderWithParser;
}

export const LegacyImageLoader = {
  dataType: null as unknown as ImageType,
  batchType: null as never,
  ...ImageFormat,
  version: VERSION,
  // TODO: byteOffset, byteLength;
  options: DEFAULT_IMAGE_LOADER_OPTIONS,
  preload
} as const satisfies Loader<ImageType, never, LegacyImageLoaderOptions>;
