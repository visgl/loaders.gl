// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  LZ4CompressUtilsDecompressor,
  type CompressUtilsCompressionOptions
} from './lz4-decompressor-compress-utils';
import {Decompressor} from './lib/compression';

/** LZ4 frame, raw block, and legacy Hadoop block decoder using compress-utils. */
export class LZ4Decompressor extends Decompressor {
  /** Codec name. */
  readonly name = 'lz4';
  /** Recognized extensions. */
  readonly extensions = ['lz4'];
  /** Recognized content encodings. */
  readonly contentEncodings = ['x-lz4'];
  /** The optional WASM implementation is available after preload. */
  readonly isSupported = true;
  /** Decoder for framed payloads. */
  private readonly framed: LZ4CompressUtilsDecompressor;
  /** Decoder for raw blocks. */
  private readonly raw: LZ4CompressUtilsDecompressor;
  /** Whether to bypass format detection. */
  private readonly useRaw: boolean;
  /** Maximum caller-provided capacity before raw/Hadoop decoding allocates. */
  private readonly maximumCapacity: number;

  /** Creates lazy framed and raw decoder bindings. */
  constructor(options: CompressUtilsCompressionOptions = {}) {
    super(options);
    this.framed = new LZ4CompressUtilsDecompressor({...options, raw: false});
    this.raw = new LZ4CompressUtilsDecompressor({...options, raw: true});
    this.useRaw = Boolean(options.raw);
    this.maximumCapacity = options.maxOutputByteLength ?? 512 * 1024 * 1024;
  }

  /** Initializes both decoder entry points for synchronous format detection. */
  async preload(modules: Record<string, any> = {}): Promise<void> {
    await Promise.all([this.framed.preload(modules), this.raw.preload(modules)]);
  }

  /** Loads the codecs and decodes one frame or bounded block. */
  async decompress(input: ArrayBuffer, size?: number): Promise<ArrayBuffer> {
    await this.preload();
    return this.decompressSync(input, size);
  }

  /** Decodes one payload after preload; raw blocks require output capacity. */
  decompressSync(input: ArrayBuffer, size?: number): ArrayBuffer {
    if (
      !this.useRaw &&
      input.byteLength >= 4 &&
      new DataView(input).getUint32(0, true) === 0x184d2204
    ) {
      return this.framed.decompressSync(input, size);
    }
    if (!Number.isSafeInteger(size) || size! < 0 || size! > this.maximumCapacity)
      throw new RangeError('lz4: provide a valid output capacity');
    if (!this.useRaw) {
      const hadoopOutput = this.decodeHadoopBlocks(input, size!);
      if (hadoopOutput) return hadoopOutput;
    }
    return this.raw.decompressSync(input, size);
  }

  /** Incrementally decodes one frame or, with raw: true, one raw block. */
  async *decompressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    yield* (this.useRaw ? this.raw : this.framed).decompressBatches(inputBatches);
  }

  /** Validates the legacy Hadoop lengths in TypeScript before decoding each raw block. */
  private decodeHadoopBlocks(input: ArrayBuffer, capacity: number): ArrayBuffer | null {
    const view = new DataView(input);
    const blocks: Uint8Array[] = [];
    let inputOffset = 0;
    let outputOffset = 0;
    try {
      while (inputOffset < input.byteLength) {
        if (input.byteLength - inputOffset < 8) return null;
        const blockSize = view.getUint32(inputOffset, false);
        const chunkSize = view.getUint32(inputOffset + 4, false);
        inputOffset += 8;
        if (
          !blockSize ||
          !chunkSize ||
          blockSize > capacity - outputOffset ||
          chunkSize > input.byteLength - inputOffset
        )
          return null;
        const decoded = new Uint8Array(
          this.raw.decompressSync(input.slice(inputOffset, inputOffset + chunkSize), blockSize)
        );
        if (decoded.length !== blockSize) return null;
        blocks.push(decoded);
        outputOffset += blockSize;
        inputOffset += chunkSize;
      }
      const output = new Uint8Array(outputOffset);
      let offset = 0;
      for (const block of blocks) {
        output.set(block, offset);
        offset += block.length;
      }
      return output.buffer;
    } catch {
      return null;
    }
  }
}

export type {CompressUtilsCompressionOptions as LZ4DecompressorOptions};
