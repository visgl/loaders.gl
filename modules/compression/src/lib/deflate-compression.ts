// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CompressionOptions} from './compression';
import {Compression} from './compression';
import {isBrowser, toArrayBuffer, promisify1} from '@loaders.gl/loader-utils';
import {
  Deflate,
  Gzip,
  Gunzip,
  Inflate,
  Unzlib,
  Zlib,
  deflateSync,
  gzipSync,
  gunzipSync,
  inflateSync,
  unzlibSync,
  zlibSync
} from 'fflate';
import type {DeflateOptions, GzipOptions} from 'fflate';
import zlib from 'zlib';
import {
  compressWithNativeCompressionStream,
  compressBatchesWithNativeCompressionStream
} from './compression-stream';
import {
  decompressWithNativeDecompressionStream,
  decompressBatchesWithNativeDecompressionStream
} from './decompression-stream';

export type DeflateCompressionOptions = CompressionOptions & {
  deflate?: {
    level?: number;
    gzip?: boolean;
    useZlib?: boolean;
    useNative?: boolean;
    [option: string]: any;
  };
  /** Creates raw data without a wrapper. */
  raw?: boolean;
};

/**
 * DEFLATE compression and decompression compatibility facade.
 * @deprecated Import a direction-specific DEFLATE compressor or decompressor.
 */
export class DeflateCompression extends Compression {
  readonly name: string = 'deflate';
  readonly extensions: string[] = [];
  readonly contentEncodings = ['deflate'];
  readonly isSupported = true;
  readonly options: DeflateCompressionOptions;

  constructor(options: DeflateCompressionOptions = {}) {
    super(options);
    this.options = options;
  }

  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    const format = this.options.raw ? null : this.options.deflate?.gzip ? 'gzip' : 'deflate';
    if (format && this.options.deflate?.useNative !== false) {
      const nativeOutput = await compressWithNativeCompressionStream(input, format);
      if (nativeOutput) return nativeOutput;
    }
    if (!isBrowser && this.options.deflate?.useZlib) {
      const buffer = this.options.deflate.gzip
        ? await promisify1(zlib.gzip)(input)
        : await promisify1(zlib.deflate)(input);
      return toArrayBuffer(buffer as Buffer);
    }
    return this.compressSync(input);
  }

  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    const format = this.options.raw
      ? 'deflate-raw'
      : this.options.deflate?.gzip
        ? 'gzip'
        : 'deflate';
    if (this.options.deflate?.useNative !== false) {
      const nativeOutput = await decompressWithNativeDecompressionStream(input, format);
      if (nativeOutput) return nativeOutput;
    }
    if (!isBrowser && this.options.deflate?.useZlib) {
      const buffer = this.options.deflate.gzip
        ? await promisify1(zlib.gunzip)(input)
        : await promisify1(zlib.inflate)(input);
      return toArrayBuffer(buffer as Buffer);
    }
    return this.decompressSync(input);
  }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    if (!isBrowser && this.options.deflate?.useZlib) {
      const buffer = this.options.deflate?.gzip ? zlib.gzipSync(input) : zlib.deflateSync(input);
      return toArrayBuffer(buffer);
    }
    const bytes = new Uint8Array(input);
    const options = (this.options.deflate || {}) as DeflateOptions & GzipOptions;
    const output = this.options.raw
      ? deflateSync(bytes, options)
      : this.options.deflate?.gzip
        ? gzipSync(bytes, options)
        : zlibSync(bytes, options);
    return toArrayBuffer(output);
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    if (!isBrowser && this.options.deflate?.useZlib) {
      const buffer = this.options.deflate?.gzip ? zlib.gunzipSync(input) : zlib.inflateSync(input);
      return toArrayBuffer(buffer);
    }
    const bytes = new Uint8Array(input);
    const output = this.options.raw
      ? inflateSync(bytes)
      : this.options.deflate?.gzip
        ? gunzipSync(bytes)
        : unzlibSync(bytes);
    return toArrayBuffer(output);
  }

  async *compressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    if (!this.options.raw && this.options.deflate?.useNative !== false) {
      const format = this.options.deflate?.gzip ? 'gzip' : 'deflate';
      const nativeBatches = compressBatchesWithNativeCompressionStream(inputBatches, format);
      if (nativeBatches) {
        yield* nativeBatches;
        return;
      }
    }
    const options = (this.options.deflate || {}) as DeflateOptions & GzipOptions;
    const processor = this.options.deflate?.gzip
      ? new Gzip(options)
      : this.options.raw
        ? new Deflate(options)
        : new Zlib(options);
    yield* this.transformBatches(processor, inputBatches);
  }

  async *decompressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const format = this.options.raw
      ? 'deflate-raw'
      : this.options.deflate?.gzip
        ? 'gzip'
        : 'deflate';
    if (this.options.deflate?.useNative !== false) {
      const nativeBatches = decompressBatchesWithNativeDecompressionStream(inputBatches, format);
      if (nativeBatches) {
        yield* nativeBatches;
        return;
      }
    }
    const processor = this.options.deflate?.gzip
      ? new Gunzip()
      : this.options.raw
        ? new Inflate()
        : new Unzlib();
    yield* this.transformBatches(processor, inputBatches);
  }

  /**
   * Streams batches through a DEFLATE-compatible processor.
   *
   * @deprecated Prefer `compressBatches` or `decompressBatches`. Retained for
   * compatibility with callers that supplied a Pako-style processor.
   */
  async *transformBatches(
    processor: {
      ondata?: (data: Uint8Array, final: boolean) => void;
      onData?: (data: Uint8Array) => void;
      onEnd?: (status: number) => void;
      push: (data: Uint8Array, final?: boolean) => boolean | void;
    },
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const chunks: ArrayBuffer[] = [];
    const appendChunk = (data: Uint8Array): void => {
      chunks.push(new Uint8Array(data).slice().buffer as ArrayBuffer);
    };
    processor.ondata = appendChunk;
    processor.onData = appendChunk;
    processor.onEnd = status => {
      if (status !== 0) {
        throw new Error(`${this.name}: streaming processor failed with status ${status}`);
      }
    };
    for await (const batch of inputBatches) {
      const result = processor.push(new Uint8Array(batch), false);
      if (result === false) {
        throw new Error(`${this.name}: streaming processor rejected a batch`);
      }
      yield* chunks.splice(0);
    }
    const result = processor.push(new Uint8Array(0), true);
    if (result === false) {
      throw new Error(`${this.name}: streaming processor rejected the final batch`);
    }
    yield* chunks;
  }
}
