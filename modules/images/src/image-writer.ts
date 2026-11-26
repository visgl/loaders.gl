// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/core/loader-utils';
import type {ImageDataType} from './types';
import {encodeImage} from './lib/encoders/encode-image';
import {IMAGE_WRITER_METADATA} from './image-writer-types';

export type ImageWriterOptions = WriterOptions & {
  image?: {
    mimeType?: 'image/png';
    jpegQuality?: number | null;
  };
};

/** Writer for image data */
export const ImageWriter = {
  ...IMAGE_WRITER_METADATA,
  encode: encodeImage
} as const satisfies WriterWithEncoder<ImageDataType, never, ImageWriterOptions>;
