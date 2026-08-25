// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Decompressor, type CompressionOptions} from './compression';
import {
  decompressBatchesWithNativeDecompressionStream,
  decompressWithNativeDecompressionStream,
  type NativeDecompressionFormat
} from './decompression-stream';

/** Runtime-provided decompressor selected by root-level metadata. */
export class NativeDecompressor extends Decompressor {
  readonly name: string;
  readonly extensions: string[];
  readonly contentEncodings: string[];
  readonly isSupported = true;

  /** Runtime stream format used for every operation. */
  private readonly format: NativeDecompressionFormat;

  constructor(
    metadata: {name: string; extensions: readonly string[]; contentEncodings: readonly string[]},
    format: NativeDecompressionFormat,
    options: CompressionOptions = {}
  ) {
    super(options);
    this.name = metadata.name;
    this.extensions = [...metadata.extensions];
    this.contentEncodings = [...metadata.contentEncodings];
    this.format = format;
  }

  /** Decompresses one buffer with the runtime-provided stream. */
  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    const output = await decompressWithNativeDecompressionStream(input, this.format);
    if (!output) throw new Error(`${this.name}: built-in decompression is no longer available`);
    return output;
  }

  /** Decompresses batches incrementally with the runtime-provided stream. */
  async *decompressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const output = decompressBatchesWithNativeDecompressionStream(inputBatches, this.format);
    if (!output) throw new Error(`${this.name}: built-in decompression is no longer available`);
    yield* output;
  }
}
