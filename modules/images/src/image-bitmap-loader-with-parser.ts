// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {parseImageBitmap, parseImageBitmapBlob} from './lib/parsers/parse-image-bitmap';
import {
  ImageBitmapLoader as ImageBitmapLoaderMetadata,
  type ImageBitmapLoaderOptions
} from './image-bitmap-loader';

const {preload: _ImageBitmapLoaderPreload, ...ImageBitmapLoaderMetadataWithoutPreload} =
  ImageBitmapLoaderMetadata;

export type {ImageBitmapLoaderOptions} from './image-bitmap-loader';

/**
 * Loads images as `ImageBitmap` in browsers and in Node.js when `@loaders.gl/polyfills` is installed.
 */
export const ImageBitmapLoaderWithParser = {
  ...ImageBitmapLoaderMetadataWithoutPreload,
  parse: parseImageBitmap,
  parseBlob: parseImageBitmapBlob
} as const satisfies LoaderWithParser<ImageBitmap, never, ImageBitmapLoaderOptions>;
