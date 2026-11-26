// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/core/loader-utils';
import {encodeImageURLToCompressedTextureURL} from './lib/encoders/encode-texture';
import {COMPRESSED_TEXTURE_WRITER_METADATA} from './compressed-texture-writer-types';

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
  ...COMPRESSED_TEXTURE_WRITER_METADATA,
  encodeURLtoURL: encodeImageURLToCompressedTextureURL,
  encode() {
    throw new Error('Not implemented');
  }
} as const satisfies WriterWithEncoder<unknown, unknown, CompressedTextureWriterOptions>;
