// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {zlibSync, type DeflateOptions} from 'fflate';
import {Compressor, type CompressionOptions} from './lib/compression';

/** Options for the fflate zlib-wrapped DEFLATE compressor. */
export type DeflateFflateCompressorOptions = CompressionOptions & {deflate?: DeflateOptions};

/** Zlib-wrapped DEFLATE compressor backed only by fflate's encoder. */
export class DeflateFflateCompressor extends Compressor {
  readonly name = 'deflate';
  readonly extensions: string[] = [];
  readonly contentEncodings = ['deflate'];
  readonly isSupported = true;
  readonly options: DeflateFflateCompressorOptions;

  constructor(options: DeflateFflateCompressorOptions = {}) {
    super(options);
    this.options = options;
  }

  /** Compresses one zlib-wrapped DEFLATE payload synchronously. */
  compressSync(input: ArrayBuffer): ArrayBuffer {
    return zlibSync(new Uint8Array(input), this.options.deflate).slice().buffer as ArrayBuffer;
  }
}
