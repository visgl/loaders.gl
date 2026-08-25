// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Inflate, Unzlib, inflateSync, unzlibSync} from 'fflate';
import {Decompressor, type CompressionOptions} from './lib/compression';
import {transformFflateBatches} from './lib/fflate-stream';

/** Options for the fflate DEFLATE decompressor. */
export type DeflateFflateDecompressorOptions = CompressionOptions & {
  /** Reads raw RFC 1951 DEFLATE without a zlib wrapper. */
  raw?: boolean;
};

/** DEFLATE decompressor backed only by fflate's decoder. */
export class DeflateFflateDecompressor extends Decompressor {
  readonly name = 'deflate';
  readonly extensions: string[] = [];
  readonly contentEncodings = ['deflate'];
  readonly isSupported = true;
  readonly options: DeflateFflateDecompressorOptions;

  constructor(options: DeflateFflateDecompressorOptions = {}) {
    super(options);
    this.options = options;
  }

  /** Decompresses one zlib-wrapped DEFLATE payload synchronously. */
  decompressSync(input: ArrayBuffer): ArrayBuffer {
    const bytes = new Uint8Array(input);
    const output = this.options.raw ? inflateSync(bytes) : unzlibSync(bytes);
    return output.slice().buffer as ArrayBuffer;
  }

  /** Decompresses DEFLATE batches incrementally. */
  async *decompressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const processor = this.options.raw ? new Inflate() : new Unzlib();
    yield* transformFflateBatches(processor, inputBatches);
  }
}
