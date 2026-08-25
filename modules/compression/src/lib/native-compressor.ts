// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Compressor, type CompressionOptions} from './compression';
import {
  compressBatchesWithNativeCompressionStream,
  compressWithNativeCompressionStream,
  type NativeCompressionFormat
} from './compression-stream';

/** Runtime-provided compressor selected by root-level metadata. */
export class NativeCompressor extends Compressor {
  readonly name: string;
  readonly extensions: string[];
  readonly contentEncodings: string[];
  readonly isSupported = true;

  /** Runtime stream format used for every operation. */
  private readonly format: NativeCompressionFormat;

  constructor(
    metadata: {name: string; extensions: readonly string[]; contentEncodings: readonly string[]},
    format: NativeCompressionFormat,
    options: CompressionOptions = {}
  ) {
    super(options);
    this.name = metadata.name;
    this.extensions = [...metadata.extensions];
    this.contentEncodings = [...metadata.contentEncodings];
    this.format = format;
  }

  /** Compresses one buffer with the runtime-provided stream. */
  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    const output = await compressWithNativeCompressionStream(input, this.format);
    if (!output) throw new Error(`${this.name}: built-in compression is no longer available`);
    return output;
  }

  /** Compresses batches incrementally with the runtime-provided stream. */
  async *compressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const output = compressBatchesWithNativeCompressionStream(inputBatches, this.format);
    if (!output) throw new Error(`${this.name}: built-in compression is no longer available`);
    yield* output;
  }
}
