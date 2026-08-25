// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {unzlibSync} from 'fflate';
import {Decompressor, type CompressionOptions} from './lib/compression';

/** Zlib-wrapped DEFLATE decompressor backed only by fflate's decoder. */
export class DeflateFflateDecompressor extends Decompressor {
  readonly name = 'deflate';
  readonly extensions: string[] = [];
  readonly contentEncodings = ['deflate'];
  readonly isSupported = true;

  constructor(options: CompressionOptions = {}) {
    super(options);
  }

  /** Decompresses one zlib-wrapped DEFLATE payload synchronously. */
  decompressSync(input: ArrayBuffer): ArrayBuffer {
    return unzlibSync(new Uint8Array(input)).slice().buffer as ArrayBuffer;
  }
}

export type {CompressionOptions as DeflateFflateDecompressorOptions};
