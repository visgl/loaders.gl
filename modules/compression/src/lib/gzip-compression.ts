// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// GZIP
// import {isBrowser} from '@loaders.gl/loader-utils';
import type {CompressionOptions} from './compression';
import {DeflateCompression} from './deflate-compression';

export type GZipCompressionOptions = CompressionOptions & {
  gzip?: {
    level?: number;
    useNative?: boolean;
    [option: string]: any;
  };
  useNative?: boolean;
};

/**
 * GZIP compression / decompression
 * @deprecated Import a direction-specific GZIP compressor or decompressor.
 */
export class GZipCompression extends DeflateCompression {
  readonly name: string = 'gzip';
  readonly extensions = ['gz', 'gzip'];
  readonly contentEncodings = ['gzip', 'x-gzip'];
  readonly isSupported = true;

  constructor(options?: GZipCompressionOptions) {
    super({
      ...options,
      deflate: {
        ...options?.gzip,
        gzip: true,
        useNative: options?.useNative ?? options?.gzip?.useNative
      }
    });
  }
}
