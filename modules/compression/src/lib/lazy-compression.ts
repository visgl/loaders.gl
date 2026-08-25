// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Compressor, Decompressor, type CompressionOptions} from './compression';
import {isNativeCompressionSupported, type NativeCompressionFormat} from './compression-stream';
import {
  isNativeDecompressionSupported,
  type NativeDecompressionFormat
} from './decompression-stream';

type TransformOptions = CompressionOptions & Record<string, any>;
type FormatMetadata = {
  name: string;
  extensions: readonly string[];
  contentEncodings: readonly string[];
};
type CompressorConstructor = new (options?: TransformOptions) => Compressor;
type DecompressorConstructor = new (options?: TransformOptions) => Decompressor;

/** Lightweight compressor that dynamically selects its concrete default implementation. */
export class LazyCompressor extends Compressor {
  readonly name: string;
  readonly extensions: string[];
  readonly contentEncodings: string[];
  readonly isSupported = true;

  /** Constructor options retained until a concrete implementation is selected. */
  private readonly options: TransformOptions;
  /** Built-in stream format to probe, or null when the format has no built-in path. */
  private readonly nativeFormat: NativeCompressionFormat | null;
  /** Returns whether built-in selection remains eligible for the merged preload options. */
  private readonly shouldUseNative: (options: TransformOptions) => boolean;
  /** Dynamically imports the balanced fallback constructor. */
  private readonly loadFallback: () => Promise<CompressorConstructor>;
  /** Selected concrete implementation after preload completes. */
  private implementation: Compressor | null = null;
  /** Shared in-flight selection used by concurrent asynchronous calls. */
  private implementationPromise: Promise<Compressor> | null = null;

  constructor(
    metadata: FormatMetadata,
    loadFallback: () => Promise<CompressorConstructor>,
    options: TransformOptions = {},
    nativeFormat: NativeCompressionFormat | null = null,
    shouldUseNative: (options: TransformOptions) => boolean = () => true
  ) {
    super(options);
    this.name = metadata.name;
    this.extensions = [...metadata.extensions];
    this.contentEncodings = [...metadata.contentEncodings];
    this.options = options;
    this.nativeFormat = nativeFormat;
    this.shouldUseNative = shouldUseNative;
    this.loadFallback = loadFallback;
  }

  /** Selects and returns the built-in or dynamically imported fallback compressor. */
  async preload(modules: Record<string, any> = {}): Promise<Compressor> {
    if (this.implementation) return this.implementation;
    const options = mergeModules(this.options, modules);
    this.implementationPromise ||= this.loadImplementation(options);
    try {
      this.implementation = await this.implementationPromise;
      return this.implementation;
    } catch (error) {
      this.implementationPromise = null;
      throw error;
    }
  }

  /** Loads the selected concrete compressor. */
  private async loadImplementation(options: TransformOptions): Promise<Compressor> {
    if (
      options.useNative !== false &&
      this.nativeFormat &&
      this.shouldUseNative(options) &&
      isNativeCompressionSupported(this.nativeFormat)
    ) {
      const {NativeCompressor} = await import('./native-compressor');
      return new NativeCompressor(this, this.nativeFormat, options);
    }
    const Compressor = await this.loadFallback();
    const implementation = new Compressor({...options, useNative: false});
    await implementation.preload(options.modules);
    return implementation;
  }

  /** Compresses after lazily selecting the default implementation. */
  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    return (await this.preload()).compress(input);
  }

  /** Compresses synchronously after an implementation has been preloaded. */
  compressSync(input: ArrayBuffer): ArrayBuffer {
    if (!this.implementation) throw new Error(`${this.name}: call preload() before compressSync()`);
    return this.implementation.compressSync(input);
  }

  /** Compresses batches after lazily selecting the default implementation. */
  async *compressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    yield* (await this.preload()).compressBatches(inputBatches);
  }
}

/** Lightweight decompressor that dynamically selects its concrete default implementation. */
export class LazyDecompressor extends Decompressor {
  readonly name: string;
  readonly extensions: string[];
  readonly contentEncodings: string[];
  readonly isSupported = true;

  /** Constructor options retained until a concrete implementation is selected. */
  private readonly options: TransformOptions;
  /** Built-in stream format to probe, or null when the format has no built-in path. */
  private readonly nativeFormat: NativeDecompressionFormat | null;
  /** Returns whether built-in selection remains eligible for the merged preload options. */
  private readonly shouldUseNative: (options: TransformOptions) => boolean;
  /** Dynamically imports the balanced fallback constructor. */
  private readonly loadFallback: () => Promise<DecompressorConstructor>;
  /** Selected concrete implementation after preload completes. */
  private implementation: Decompressor | null = null;
  /** Shared in-flight selection used by concurrent asynchronous calls. */
  private implementationPromise: Promise<Decompressor> | null = null;

  constructor(
    metadata: FormatMetadata,
    loadFallback: () => Promise<DecompressorConstructor>,
    options: TransformOptions = {},
    nativeFormat: NativeDecompressionFormat | null = null,
    shouldUseNative: (options: TransformOptions) => boolean = () => true
  ) {
    super(options);
    this.name = metadata.name;
    this.extensions = [...metadata.extensions];
    this.contentEncodings = [...metadata.contentEncodings];
    this.options = options;
    this.nativeFormat = nativeFormat;
    this.shouldUseNative = shouldUseNative;
    this.loadFallback = loadFallback;
  }

  /** Selects and returns the built-in or dynamically imported fallback decompressor. */
  async preload(modules: Record<string, any> = {}): Promise<Decompressor> {
    if (this.implementation) return this.implementation;
    const options = mergeModules(this.options, modules);
    this.implementationPromise ||= this.loadImplementation(options);
    try {
      this.implementation = await this.implementationPromise;
      return this.implementation;
    } catch (error) {
      this.implementationPromise = null;
      throw error;
    }
  }

  /** Loads the selected concrete decompressor. */
  private async loadImplementation(options: TransformOptions): Promise<Decompressor> {
    if (
      options.useNative !== false &&
      this.nativeFormat &&
      this.shouldUseNative(options) &&
      isNativeDecompressionSupported(this.nativeFormat)
    ) {
      const {NativeDecompressor} = await import('./native-decompressor');
      return new NativeDecompressor(this, this.nativeFormat, options);
    }
    const Decompressor = await this.loadFallback();
    const implementation = new Decompressor({...options, useNative: false});
    await implementation.preload(options.modules);
    return implementation;
  }

  /** Decompresses after lazily selecting the default implementation. */
  async decompress(input: ArrayBuffer, size?: number): Promise<ArrayBuffer> {
    return (await this.preload()).decompress(input, size);
  }

  /** Decompresses synchronously after an implementation has been preloaded. */
  decompressSync(input: ArrayBuffer, size?: number): ArrayBuffer {
    if (!this.implementation) {
      throw new Error(`${this.name}: call preload() before decompressSync()`);
    }
    return this.implementation.decompressSync(input, size);
  }

  /** Decompresses batches after lazily selecting the default implementation. */
  async *decompressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    yield* (await this.preload()).decompressBatches(inputBatches);
  }
}

/** Merges constructor and preload module injection without mutating caller options. */
function mergeModules(options: TransformOptions, modules: Record<string, any>): TransformOptions {
  return {...options, modules: {...options.modules, ...modules}};
}
