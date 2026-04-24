import type {Loader, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {ImageType} from './types';
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
  id: 'image',
  module: 'images',
  name: 'Images',
  version: VERSION,
  mimeTypes: MIME_TYPES,
  extensions: EXTENSIONS,
  // TODO: byteOffset, byteLength;
  tests: [arrayBuffer => Boolean(getBinaryImageMetadata(new DataView(arrayBuffer)))],
  options: DEFAULT_IMAGE_LOADER_OPTIONS,
  preload
} as const satisfies Loader<ImageType, never, ImageLoaderOptions>;
