// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {gunzipSync} from 'fflate';
import {Decompressor, type CompressionOptions} from './lib/compression';

/** GZIP decompressor backed only by fflate's decoder. */
export class GZipFflateDecompressor extends Decompressor {
  readonly name = 'gzip';
  readonly extensions = ['gz', 'gzip'];
  readonly contentEncodings = ['gzip', 'x-gzip'];
  readonly isSupported = true;

  constructor(options: CompressionOptions = {}) {
    super(options);
  }

  /** Decompresses one GZIP payload synchronously. */
  decompressSync(input: ArrayBuffer): ArrayBuffer {
    return gunzipSync(new Uint8Array(input)).slice().buffer as ArrayBuffer;
  }
}

export type {CompressionOptions as GZipFflateDecompressorOptions};
