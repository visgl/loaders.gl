// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';
import {getBinaryImageMetadata} from './lib/category-api/binary-image-api';

export const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'svg', 'avif'];
export const IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/vnd.microsoft.icon',
  'image/svg+xml'
];

/** Generic browser image format. */
export const ImageFormat = {
  id: 'image',
  module: 'images',
  name: 'Images',
  encoding: 'image',
  format: 'image',
  mimeTypes: IMAGE_MIME_TYPES,
  extensions: IMAGE_EXTENSIONS,
  tests: [arrayBuffer => Boolean(getBinaryImageMetadata(new DataView(arrayBuffer)))]
} as const satisfies Format;

/** Browser ImageBitmap image format. */
export const ImageBitmapFormat = {
  ...ImageFormat,
  id: 'imagebitmap',
  name: 'ImageBitmap',
  format: 'image-bitmap'
} as const satisfies Format;
