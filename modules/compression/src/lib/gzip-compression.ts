// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// GZIP
// import {isBrowser} from '@loaders.gl/loader-utils';
import type {CompressionOptions} from './compression';
import {DeflateCompression} from './deflate-compression';
import pako from 'pako'; // https://bundlephobia.com/package/pako

export type GZipCompressionOptions = CompressionOptions & {
  gzip?: pako.InflateOptions & pako.DeflateOptions;
};

/**
 * GZIP compression / decompression
 */
export class GZipCompression extends DeflateCompression {
  readonly name: string = 'gzip';
  readonly extensions = ['gz', 'gzip'];
  readonly contentEncodings = ['gzip', 'x-gzip'];
  readonly isSupported = true;

  constructor(options?: GZipCompressionOptions) {
    super({...options, deflate: {...options?.gzip, gzip: true}});
  }
}
