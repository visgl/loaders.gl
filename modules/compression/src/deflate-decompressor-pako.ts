// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {inflate, type InflateOptions} from 'pako';
import {Decompressor, type CompressionOptions} from './lib/compression';

/** Options for the Pako zlib-wrapped DEFLATE decompressor. */
export type DeflatePakoDecompressorOptions = CompressionOptions & {inflate?: InflateOptions};

/** Zlib-wrapped DEFLATE decompressor backed only by Pako's decoder. */
export class DeflatePakoDecompressor extends Decompressor {
  readonly name = 'deflate';
  readonly extensions: string[] = [];
  readonly contentEncodings = ['deflate'];
  readonly isSupported = true;
  readonly options: DeflatePakoDecompressorOptions;

  constructor(options: DeflatePakoDecompressorOptions = {}) {
    super(options);
    this.options = options;
  }

  /** Decompresses one zlib-wrapped DEFLATE payload synchronously. */
  decompressSync(input: ArrayBuffer): ArrayBuffer {
    return inflate(new Uint8Array(input), this.options.inflate).slice().buffer as ArrayBuffer;
  }
}
