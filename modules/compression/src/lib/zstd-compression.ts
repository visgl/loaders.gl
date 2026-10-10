// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// ZSTD
import type {CompressionOptions} from './compression';
import {Compression} from './compression';
import {
  initializeWasmModule,
  registerJSModules,
  checkJSModule,
  getJSModule,
  getJSModuleOrNull,
  ensureArrayBuffer
} from '@loaders.gl/loader-utils';

// import {ZstdCodec} from 'zstd-codec'; // https://bundlephobia.com/package/zstd-codec

const CHUNK_SIZE = 1000000; // Tested value

let zstdPromise: Promise<any>;
let zstd;

/**
 * Zstandard compression / decompression
 */
export class ZstdCompression extends Compression {
  readonly name: string = 'zstd';
  readonly extensions = [];
  readonly contentEncodings = [];
  readonly isSupported = true;
  readonly options: CompressionOptions;

  /**
   * zstd-codec is an injectable dependency due to big size
   * @param options
   */
  constructor(options: CompressionOptions) {
    super(options);
    this.options = options;
    registerJSModules(options?.modules);
  }

  async preload(modules: Record<string, any> = {}): Promise<void> {
    registerJSModules(modules);
    checkJSModule('zstd-codec', this.name);
    const ZstdCodec = getJSModuleOrNull('zstd-codec');
    if (zstdPromise === undefined && ZstdCodec) {
      // The current dependency exposes callback readiness but hides asynchronous failures.
      zstdPromise = initializeWasmModule<any, any>(
        (onInitialized) => ZstdCodec.run(onInitialized),
        (module) => {
          const {Generic, Simple, Streaming, Dict} = module;
          return {Generic, Simple, Streaming, Dict};
        }
      );
    }
    if (zstdPromise !== undefined) {
      zstd = await zstdPromise;
    }
  }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    getJSModule('zstd-codec', this.name);
    const simpleZstd = new zstd.Simple();
    const inputArray = new Uint8Array(input);
    return simpleZstd.compress(inputArray).buffer;
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
    await this.preload();
    const simpleZstd = new zstd.Streaming();
    const inputArray = new Uint8Array(input);

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
