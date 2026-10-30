// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import {parseImageBitmap, parseImageBitmapBlob} from './lib/parsers/parse-image-bitmap';
import {ImageLoader as ImageLoaderMetadata, type ImageLoaderOptions} from './image-loader-types';

const {preload: _ImageLoaderPreload, ...ImageLoaderMetadataWithoutPreload} = ImageLoaderMetadata;

export type {ImageLoaderOptions} from './image-loader-types';

/**
 * Loads images as `ImageBitmap` in browsers and in Node.js when `@loaders.gl/core/polyfills` is installed.
 */
export const ImageLoaderWithParser = {
  ...ImageLoaderMetadataWithoutPreload,
  parse: parseImageBitmap,
  parseBlob: parseImageBitmapBlob
} as const satisfies LoaderWithParser<ImageBitmap, never, ImageLoaderOptions>;
