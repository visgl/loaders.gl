import type {Loader, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {ImageType} from './types';
import {VERSION} from './lib/utils/version';
import {ImageFormat} from './image-format';

/**
 * @deprecated in v4.4. Use `ImageBitmapLoaderOptions` for new code.
 */
export type ImageLoaderOptions = StrictLoaderOptions & {
  image?: {
    type?: 'auto' | 'data' | 'imagebitmap' | 'image';
    decode?: boolean;
  };
  imagebitmap?: ImageBitmapOptions & Record<string, unknown>;
};

const DEFAULT_IMAGE_LOADER_OPTIONS: ImageLoaderOptions = {
  image: {
    type: 'auto',
    decode: true
  }
  // imagebitmap: {} - passes (platform dependent) parameters to ImageBitmap constructor
};

/**
 * @deprecated in v4.4. Use `ImageBitmapLoader` for a pure `ImageBitmap` return type.
 *
 * Metadata-only loader for platform-specific image types.
 */
async function preload() {
  const {ImageLoaderWithParser} = await import('./image-loader-with-parser');
  return ImageLoaderWithParser;
}

export const ImageLoader = {
  dataType: null as unknown as ImageType,
  batchType: null as never,
  ...ImageFormat,
  version: VERSION,
  // TODO: byteOffset, byteLength;
  options: DEFAULT_IMAGE_LOADER_OPTIONS,
  preload
} as const satisfies Loader<ImageType, never, ImageLoaderOptions>;
