// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {toArrayBuffer} from '@loaders.gl/loader-utils';
import {Decompressor, type CompressionOptions} from './lib/compression';

type SnappyUncompressor = (input: Uint8Array, outputLength: number) => Uint8Array;

/** One synchronously invoked decoder per JavaScript realm avoids recompiling WASM per reader. */
let sharedSnappyUncompressorPromise: Promise<SnappyUncompressor> | undefined;

/** Snappy decompressor backed by hysnappy's small synchronously instantiated WASM module. */
export class SnappyHysnappyDecompressor extends Decompressor {
  /** Compression format name. */
  readonly name = 'snappy';
  /** Snappy does not have a standard standalone file extension. */
  readonly extensions: string[] = [];
  /** Snappy does not have a standard HTTP content encoding. */
  readonly contentEncodings: string[] = [];
  /** Whether the runtime can instantiate the embedded WASM decoder. */
  readonly isSupported = typeof WebAssembly !== 'undefined';

  /** Cached decoder instantiated by {@link preload}. */
  private uncompressor?: SnappyUncompressor;

  /** Loads and instantiates the embedded hysnappy WASM module once per JavaScript realm. */
  async preload(): Promise<void> {
    if (!this.uncompressor) {
      sharedSnappyUncompressorPromise ||= import('hysnappy').then(hysnappy =>
        hysnappy.snappyUncompressor()
      );
      this.uncompressor = await sharedSnappyUncompressorPromise;
    }
  }

  /** Decompresses one Snappy payload synchronously after preload. */
  decompressSync(input: ArrayBuffer, size?: number): ArrayBuffer {
    if (!this.uncompressor) {
      throw new Error('snappy hysnappy decoder has not been preloaded');
    }
    const bytes = new Uint8Array(input);
    const outputLength = size ?? readSnappyUncompressedLength(bytes);
    return toArrayBuffer(this.uncompressor(bytes, outputLength));
  }
}

/** Reads the uncompressed byte length stored as the leading Snappy varint. */
function readSnappyUncompressedLength(input: Uint8Array): number {
  let value = 0;
  let multiplier = 1;
  for (let byteIndex = 0; byteIndex < Math.min(input.byteLength, 5); byteIndex++) {
    const byte = input[byteIndex];
    value += (byte & 0x7f) * multiplier;
    if ((byte & 0x80) === 0) {
      if (!Number.isSafeInteger(value)) throw new Error('invalid Snappy uncompressed length');
      return value;
    }
    multiplier *= 128;
  }
  throw new Error('invalid Snappy uncompressed length');
}

export type {CompressionOptions as SnappyHysnappyDecompressorOptions};
