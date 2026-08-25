// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Gzip, gzipSync, type GzipOptions} from 'fflate';
import {Compressor, type CompressionOptions} from './lib/compression';
import {transformFflateBatches} from './lib/fflate-stream';

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

  /** Compresses GZIP batches incrementally. */
  async *compressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    yield* transformFflateBatches(new Gzip(this.options.gzip || {}), inputBatches);
  }
}
