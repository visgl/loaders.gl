// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Decompressor, type CompressionOptions} from './lib/compression';
import {decodeLzoBlock} from './lib/compress-utils/lzo/decode';

/** Options for bounded raw LZO1X block decoding. */
export type LzoDecompressorOptions = CompressionOptions & {
  /** Maximum caller-provided output capacity. Defaults to 64 MiB. */
  maxOutputSize?: number;
  /** Selects the synchronous JavaScript fallback when false. */
  useWasm?: boolean;
};

/** Raw LZO1X decoder for Parquet pages and ORC chunks; no compression or containers. */
export class LzoDecompressor extends Decompressor {
  /** Codec name. */
  readonly name = 'lzo';
  /** Raw blocks have no file extension. */
  readonly extensions: string[] = [];
  /** Raw blocks have no HTTP content encoding. */
  readonly contentEncodings: string[] = [];
  /** JavaScript fallback remains available without WASM. */
  readonly isSupported = true;
  /** Bounded output capacity. */
  private readonly maximumOutputSize: number;
  /** Whether to try the vendored WASM decoder. */
  private readonly useWasm: boolean;
  /** Selected synchronous decoder after preload. */
  private decodeBlock = decodeLzoBlock;
  /** Shared in-flight initialization. */
  private preloadPromise: Promise<void> | null = null;

  /** Creates a decoder with a bounded output allocation. */
  constructor(options: LzoDecompressorOptions = {}) {
    super(options);
    this.maximumOutputSize = options.maxOutputSize ?? 64 * 1024 * 1024;
    if (
      !Number.isSafeInteger(this.maximumOutputSize) ||
      this.maximumOutputSize < 0 ||
      this.maximumOutputSize > 0x7fffffff
    )
      throw new RangeError('lzo: invalid maxOutputSize');
    this.useWasm = options.useWasm !== false;
  }

  /** Preloads compress-utils WASM, retaining JavaScript when compilation is blocked. */
  override async preload(): Promise<void> {
    this.preloadPromise ||= this.loadDecoder();
    await this.preloadPromise;
  }

  /** Selects the WASM backend once per instance. */
  private async loadDecoder(): Promise<void> {
    if (!this.useWasm || typeof WebAssembly === 'undefined') return;
    try {
      const {loadLzoWasm} = await import('./lib/compress-utils/lzo/wasm');
      this.decodeBlock = await loadLzoWasm();
    } catch {
      this.decodeBlock = decodeLzoBlock;
    }
  }

  /** Decodes one block synchronously into a required output capacity. */
  override decompressSync(input: ArrayBuffer, size?: number): ArrayBuffer {
    if (
      !Number.isSafeInteger(size) ||
      size === undefined ||
      size < 0 ||
      size > this.maximumOutputSize
    )
      throw new RangeError('lzo: size must be a bounded integer output capacity');
    return this.decodeBlock(new Uint8Array(input), size).buffer as ArrayBuffer;
  }
}
