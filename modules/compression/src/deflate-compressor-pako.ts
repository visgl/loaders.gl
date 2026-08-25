// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {deflate, type DeflateFunctionOptions} from 'pako';
import {Compressor, type CompressionOptions} from './lib/compression';

/** Options for the Pako zlib-wrapped DEFLATE compressor. */
export type DeflatePakoCompressorOptions = CompressionOptions & {deflate?: DeflateFunctionOptions};

/** Zlib-wrapped DEFLATE compressor backed only by Pako's encoder. */
export class DeflatePakoCompressor extends Compressor {
  readonly name = 'deflate';
  readonly extensions: string[] = [];
  readonly contentEncodings = ['deflate'];
  readonly isSupported = true;
  readonly options: DeflatePakoCompressorOptions;

  constructor(options: DeflatePakoCompressorOptions = {}) {
    super(options);
    this.options = options;
  }

  /** Compresses one zlib-wrapped DEFLATE payload synchronously. */
  compressSync(input: ArrayBuffer): ArrayBuffer {
    return deflate(new Uint8Array(input), this.options.deflate).slice().buffer as ArrayBuffer;
  }
}
