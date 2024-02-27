// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import type {ImageDataType} from './types';
import {VERSION} from './lib/utils/version';
import {encodeImage} from './lib/encoders/encode-image';

export type ImageWriterOptions = WriterOptions & {
  image?: {
    mimeType?: 'image/png';
    jpegQuality?: number | null;
  };
};

/** Writer for image data */
export const ImageWriter = {
  name: 'Images',
  id: 'image',
  module: 'images',
  version: VERSION,
  extensions: ['jpeg'],
  options: {
    image: {
      mimeType: 'image/png',
      jpegQuality: null
    }
  },
  encode: encodeImage
} as const satisfies WriterWithEncoder<ImageDataType, never, ImageWriterOptions>;
