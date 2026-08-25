// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ungzip, type InflateOptions} from 'pako';
import {Decompressor, type CompressionOptions} from './lib/compression';

/** Options for the Pako GZIP decompressor. */
export type GZipPakoDecompressorOptions = CompressionOptions & {inflate?: InflateOptions};

/** GZIP decompressor backed only by Pako's decoder. */
export class GZipPakoDecompressor extends Decompressor {
  readonly name = 'gzip';
  readonly extensions = ['gz', 'gzip'];
  readonly contentEncodings = ['gzip', 'x-gzip'];
  readonly isSupported = true;
  readonly options: GZipPakoDecompressorOptions;

  constructor(options: GZipPakoDecompressorOptions = {}) {
    super(options);
    this.options = options;
  }

  /** Decompresses one GZIP payload synchronously. */
  decompressSync(input: ArrayBuffer): ArrayBuffer {
    return ungzip(new Uint8Array(input), this.options.inflate).slice().buffer as ArrayBuffer;
  }
}
