// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// ZSTD
import type {CompressionOptions} from './compression';
import {Compression} from './compression';
import {
  registerJSModules,
  getJSModule,
  getJSModuleOrNull,
  ensureArrayBuffer
} from '@loaders.gl/loader-utils';
import {compressWithNativeCompressionStream} from './compression-stream';
import {decompressWithNativeDecompressionStream} from './decompression-stream';

// import {ZstdCodec} from 'zstd-codec'; // https://bundlephobia.com/package/zstd-codec

const CHUNK_SIZE = 1000000; // Tested value

let zstdPromise: Promise<any>;
let zstd;

/** Options for automatic Zstandard compression selection. */
export type ZstdCompressionOptions = CompressionOptions & {
  /** Disables built-in stream probing. Prefer `zstd.useNative` in new code. */
  useNative?: boolean;
  zstd?: {
    /** Whether asynchronous methods may use the built-in stream implementation. */
    useNative?: boolean;
  };
};

/**
 * Zstandard compression / decompression
 * @deprecated Import a direction-specific Zstandard compressor or decompressor.
 */
export class ZstdCompression extends Compression {
  readonly name: string = 'zstd';
  readonly extensions = [];
  readonly contentEncodings = [];
  readonly isSupported = true;
  readonly options: ZstdCompressionOptions;

  /**
   * zstd-codec is an injectable dependency due to big size
   * @param options
   */
  constructor(options: ZstdCompressionOptions = {}) {
    super(options);
    this.options = options;
    registerJSModules(options?.modules);
  }

  async preload(modules: Record<string, any> = {}): Promise<void> {
    registerJSModules(modules);
    const ZstdCodec = getJSModuleOrNull('zstd-codec');
    // eslint-disable-next-line  @typescript-eslint/no-misused-promises
    if (!zstdPromise && ZstdCodec) {
      zstdPromise = new Promise(resolve => ZstdCodec.run(zstd => resolve(zstd)));
    }
    if (zstdPromise) {
      zstd = await zstdPromise;
    }
  }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    getJSModule('zstd-codec', this.name);
    const simpleZstd = new zstd.Simple();
    const inputArray = new Uint8Array(input);
    return simpleZstd.compress(inputArray).buffer;
  }

  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    if (this.options.useNative !== false && this.options.zstd?.useNative !== false) {
      const nativeOutput = await compressWithNativeCompressionStream(input, 'zstd');
      if (nativeOutput) return nativeOutput;
    }
    await this.preload();
    return this.compressSync(input);
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    getJSModule('zstd-codec', this.name);
    const simpleZstd = new zstd.Simple();
    // var ddict = new zstd.Dict.Decompression(dictData);
    // var jsonBytes = simpleZstd.decompressUsingDict(jsonZstData, ddict);
    const inputArray = new Uint8Array(input);
    return simpleZstd.decompress(inputArray).buffer;
  }

  async decompress(input: ArrayBuffer, size?: number): Promise<ArrayBuffer> {
    if (
      !getJSModuleOrNull('zstd-codec') &&
      this.options.useNative !== false &&
      this.options.zstd?.useNative !== false
    ) {
      const nativeOutput = await decompressWithNativeDecompressionStream(input, 'zstd');
      if (nativeOutput) return nativeOutput;
    }
    await this.preload();
    const inputArray = new Uint8Array(input);

    if (!zstd) {
      const {decompressZstd} = await import('@loaders.gl/compression/zstd-fallback');
      return ensureArrayBuffer(decompressZstd(inputArray));
    }

    const simpleZstd = new zstd.Streaming();

    const chunks: Uint8Array[] = [];
    for (let i = 0; i <= inputArray.length; i += CHUNK_SIZE) {
      const chunkView = inputArray.subarray(i, i + CHUNK_SIZE);
      const chunkArrayBuffer = ensureArrayBuffer(chunkView);
      chunks.push(new Uint8Array(chunkArrayBuffer));
    }

    const decompressResult = await simpleZstd.decompressChunks(chunks);
    return decompressResult.buffer;
  }
}
