// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Deflate, Zlib, deflateSync, zlibSync, type DeflateOptions} from 'fflate';
import {Compressor, type CompressionOptions} from './lib/compression';
import {transformFflateBatches} from './lib/fflate-stream';

/** Options for the fflate zlib-wrapped DEFLATE compressor. */
export type DeflateFflateCompressorOptions = CompressionOptions & {
  deflate?: DeflateOptions;
  /** Emits raw RFC 1951 DEFLATE without a zlib wrapper. */
  raw?: boolean;
};

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
    const bytes = new Uint8Array(input);
    const output = this.options.raw
      ? deflateSync(bytes, this.options.deflate)
      : zlibSync(bytes, this.options.deflate);
    return output.slice().buffer as ArrayBuffer;
  }

  /** Compresses DEFLATE batches incrementally. */
  async *compressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const processor = this.options.raw
      ? new Deflate(this.options.deflate || {})
      : new Zlib(this.options.deflate || {});
    yield* transformFflateBatches(processor, inputBatches);
  }
}
