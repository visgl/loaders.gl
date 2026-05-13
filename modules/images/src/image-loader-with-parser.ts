import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ImageType} from './types';
import {parseImage} from './lib/parsers/parse-image';
import {ImageLoader as ImageLoaderMetadata, type ImageLoaderOptions} from './image-loader';

const {preload: _ImageLoaderPreload, ...ImageLoaderMetadataWithoutPreload} = ImageLoaderMetadata;

export type {ImageLoaderOptions} from './image-loader';

/**
 * @deprecated in v4.4. Use `ImageBitmapLoader` for a pure `ImageBitmap` return type.
 *
 * Loads a platform-specific image type for compatibility with older code.
 */
export const ImageLoaderWithParser = {
  ...ImageLoaderMetadataWithoutPreload,
  parse: parseImage
} as const satisfies LoaderWithParser<ImageType, never, ImageLoaderOptions>;
