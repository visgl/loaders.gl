// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {gzip, type DeflateFunctionOptions} from 'pako';
import {Compressor, type CompressionOptions} from './lib/compression';

/** Options for the Pako GZIP compressor. */
export type GZipPakoCompressorOptions = CompressionOptions & {gzip?: DeflateFunctionOptions};

/** GZIP compressor backed only by Pako's encoder. */
export class GZipPakoCompressor extends Compressor {
  readonly name = 'gzip';
  readonly extensions = ['gz', 'gzip'];
  readonly contentEncodings = ['gzip', 'x-gzip'];
  readonly isSupported = true;
  readonly options: GZipPakoCompressorOptions;

  constructor(options: GZipPakoCompressorOptions = {}) {
    super(options);
    this.options = options;
  }

  /** Compresses one GZIP payload synchronously. */
  compressSync(input: ArrayBuffer): ArrayBuffer {
    return gzip(new Uint8Array(input), this.options.gzip).slice().buffer as ArrayBuffer;
  }
}
