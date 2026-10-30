// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {ImageType} from './types';
import {parseImage} from './lib/parsers/parse-image';
import {
  LegacyImageLoader as ImageLoaderMetadata,
  type LegacyImageLoaderOptions
} from './legacy-image-loader-types';

const {preload: _ImageLoaderPreload, ...ImageLoaderMetadataWithoutPreload} = ImageLoaderMetadata;

export type {LegacyImageLoaderOptions} from './legacy-image-loader-types';

/**
 * @deprecated in v4.4. Use `ImageLoader` for a pure `ImageBitmap` return type.
 *
 * Loads a platform-specific image type for compatibility with older code.
 */
export const LegacyImageLoaderWithParser = {
  ...ImageLoaderMetadataWithoutPreload,
  parse: parseImage
} as const satisfies LoaderWithParser<ImageType, never, LegacyImageLoaderOptions>;
