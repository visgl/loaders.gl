// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DDSTextureFormat} from './texture-format';
import {VERSION} from './lib/utils/version';
import type {CompressedTextureWriterOptions} from './compressed-texture-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

/** Shared CompressedTextureWriter metadata and defaults. */
export const COMPRESSED_TEXTURE_WRITER_METADATA = {
  ...DDSTextureFormat,
  name: 'DDS Texture Container',
  id: 'dds',
  module: 'images',
  version: VERSION,
  extensions: ['dds'],
  mimeTypes: ['image/vnd-ms.dds', 'image/x-dds', 'application/octet-stream'],
  options: {
    texture: {
      format: 'auto',
      compression: 'auto',
      quality: 'auto',
      mipmap: false,
      flipY: false,
      toolFlags: ''
    }
  }
} as const satisfies Writer<unknown, unknown, CompressedTextureWriterOptions>;

/** Metadata for encoding with CompressedTextureWriter through the core APIs. */
export const CompressedTextureWriter = {
  ...COMPRESSED_TEXTURE_WRITER_METADATA,
  dataType: null as unknown,
  batchType: null as unknown,
  options: COMPRESSED_TEXTURE_WRITER_METADATA.options as CompressedTextureWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {CompressedTextureWriter} = await import('./compressed-texture-writer.js');
    return CompressedTextureWriter;
  }
} as const satisfies Writer<unknown, unknown, CompressedTextureWriterOptions>;
