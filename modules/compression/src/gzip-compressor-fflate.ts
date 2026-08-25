// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {gzipSync, type GzipOptions} from 'fflate';
import {Compressor, type CompressionOptions} from './lib/compression';

/** Options for the fflate GZIP compressor. */
export type GZipFflateCompressorOptions = CompressionOptions & {gzip?: GzipOptions};

/** GZIP compressor backed only by fflate's encoder. */
export class GZipFflateCompressor extends Compressor {
  readonly name = 'gzip';
  readonly extensions = ['gz', 'gzip'];
  readonly contentEncodings = ['gzip', 'x-gzip'];
  readonly isSupported = true;
  readonly options: GZipFflateCompressorOptions;

  constructor(options: GZipFflateCompressorOptions = {}) {
    super(options);
    this.options = options;
  }

  /** Compresses one GZIP payload synchronously. */
  compressSync(input: ArrayBuffer): ArrayBuffer {
    return gzipSync(new Uint8Array(input), this.options.gzip).slice().buffer as ArrayBuffer;
  }
}
