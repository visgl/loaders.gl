// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ImageDataType} from './types';
import {VERSION} from './lib/utils/version';
import type {ImageWriterOptions} from './image-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

/** Shared ImageWriter metadata and defaults. */
export const IMAGE_WRITER_METADATA = {
  name: 'Images',
  id: 'image',
  module: 'images',
  version: VERSION,
  extensions: ['jpeg'],
  mimeTypes: [],
  options: {
    image: {
      mimeType: 'image/png',
      jpegQuality: null
    }
  }
} as const satisfies Writer<ImageDataType, never, ImageWriterOptions>;

/** Metadata for encoding with ImageWriter through the core APIs. */
export const ImageWriter = {
  ...IMAGE_WRITER_METADATA,
  dataType: null as unknown as ImageDataType,
  batchType: null as never,
  options: IMAGE_WRITER_METADATA.options as ImageWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {ImageWriter} = await import('./image-writer.js');
    return ImageWriter;
  }
} as const satisfies Writer<ImageDataType, never, ImageWriterOptions>;
