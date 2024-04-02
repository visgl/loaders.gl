// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// ZSTD
import type {CompressionOptions} from './compression';
import {Compression} from './compression';
import {registerJSModules, getJSModule} from '@loaders.gl/loader-utils';

// import {ZstdCodec} from 'zstd-codec'; // https://bundlephobia.com/package/zstd-codec

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
    getJSModule('zstd-codec', this.name);
  }

  async preload(modules: Record<string, any> = {}): Promise<void> {
    registerJSModules(modules);
    const ZstdCodec = getJSModule('zstd-codec', this.name);
    // eslint-disable-next-line  @typescript-eslint/no-misused-promises
    if (!zstdPromise && ZstdCodec) {
      zstdPromise = new Promise((resolve) => ZstdCodec.run((zstd) => resolve(zstd)));
      zstd = await zstdPromise;
    }
  }

  compressSync(input: ArrayBuffer): ArrayBuffer {
    const simpleZstd = new zstd.Simple();
    const inputArray = new Uint8Array(input);
    return simpleZstd.compress(inputArray).buffer;
  }

  decompressSync(input: ArrayBuffer): ArrayBuffer {
    const simpleZstd = new zstd.Simple();
    // var ddict = new zstd.Dict.Decompression(dictData);
    // var jsonBytes = simpleZstd.decompressUsingDict(jsonZstData, ddict);
    const inputArray = new Uint8Array(input);
    return simpleZstd.decompress(inputArray).buffer;
  }
}
