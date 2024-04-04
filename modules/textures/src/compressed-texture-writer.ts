// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {encodeImageURLToCompressedTextureURL} from './lib/encoders/encode-texture';

/** Compressed Texture writer options */
export type CompressedTextureWriterOptions = WriterOptions & {
  /** @deprecated current working directory */
  cwd?: string;
  /** Compressed Texture writer options */
  texture?: {
    format: string;
    compression: string;
    quality: string;
    mipmap: boolean;
    flipY: boolean;
    toolFlags: string;
  };
};

/**
 * DDS Texture Container Exporter
 */
export const CompressedTextureWriter = {
  name: 'DDS Texture Container',
  id: 'dds',
  module: 'textures',
  version: VERSION,

  extensions: ['dds'],

  options: {
    texture: {
      format: 'auto',
      compression: 'auto',
      quality: 'auto',
      mipmap: false,
      flipY: false,
      toolFlags: ''
    }
  },

  encodeURLtoURL: encodeImageURLToCompressedTextureURL,
  encode() {
    throw new Error('Not implemented');
  }
} as const satisfies WriterWithEncoder<unknown, unknown, CompressedTextureWriterOptions>;
