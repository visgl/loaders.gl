// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Compression, Compressor, Decompressor, type CompressionOptions} from './compression';

type CompressUtilsStream = {
  write(input: Uint8Array): Uint8Array;
  finish(): Uint8Array;
  destroy(): void;
};

type CompressUtilsCompressModule = {
  preload?(): Promise<void>;
  compressSync?(input: Uint8Array, options?: Record<string, unknown>): Uint8Array;
  compress(input: Uint8Array, options?: Record<string, unknown>): Promise<Uint8Array>;
  createCompressStream?(options?: Record<string, unknown>): Promise<CompressUtilsStream>;
};

/** Decoder API shared by framed and decoder-only compress-utils subpaths. */
export type CompressUtilsDecompressModule = {
  preload?(): Promise<void>;
  decompressSync?(input: Uint8Array, options?: Record<string, unknown>): Uint8Array;
  decompress(input: Uint8Array, options?: Record<string, unknown>): Promise<Uint8Array>;
  createDecompressStream?(): Promise<CompressUtilsStream>;
};

/** Options shared by the optional compress-utils codec bindings. */
export type CompressUtilsCompressionOptions = CompressionOptions & {
  /** Options passed to the compress-utils encoder or decoder. */
  compressUtils?: Record<string, unknown>;
  /** Selects raw blocks instead of framed DEFLATE or LZ4 data. */
  raw?: boolean;
  /** Allows built-in streams for root-level asynchronous APIs. */
  useNative?: boolean;
};

type CompressUtilsMetadata = {name: string; extensions?: string[]; contentEncodings?: string[]};

/** Compression-only binding for one independently imported compress-utils encoder. */
export class CompressUtilsCompressor extends Compressor {
  readonly name: string;
  readonly extensions: string[];
  readonly contentEncodings: string[];
  readonly isSupported = true;
  readonly options: CompressUtilsCompressionOptions;

  private readonly loadModule: () => Promise<CompressUtilsCompressModule>;
  /** Module initialized for synchronous operations. */
  private module: CompressUtilsCompressModule | null = null;
  /** Shared import and WASM initialization for concurrent callers. */
  private modulePromise: Promise<void> | null = null;

  /** Creates a format-specific compress-utils encoder. */
  constructor(
    metadata: CompressUtilsMetadata,
    loadModule: () => Promise<CompressUtilsCompressModule>,
    options: CompressUtilsCompressionOptions = {}
  ) {
    super(options);
    this.name = metadata.name;
    this.extensions = metadata.extensions || [];
    this.contentEncodings = metadata.contentEncodings || [];
    this.loadModule = loadModule;
    this.options = options;
  }

  /** Imports and initializes the codec without loading the opposite direction. */
  async preload(modules: Record<string, any> = {}): Promise<void> {
    await super.preload(modules);
    this.modulePromise ||= this.loadModule().then(async module => {
      await module.preload?.();
      this.module = module;
    });
    try {
      await this.modulePromise;
    } catch (error) {
      this.modulePromise = null;
      throw error;
    }
  }

  /** Runs synchronously after preload has initialized the WASM codec. */
  compressSync(input: ArrayBuffer): ArrayBuffer {
    if (!this.module?.compressSync)
      throw new Error(`${this.name}: call preload() before compressSync()`);
    return copyArrayBuffer(
      this.module.compressSync(new Uint8Array(input), this.options.compressUtils)
    );
  }

  /** Compresses one buffer with the selected compress-utils encoder. */
  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    await this.preload();
    const module = this.module!;
    const output = await module.compress(new Uint8Array(input), this.options.compressUtils);
    return copyArrayBuffer(output);
  }

  /** Incrementally compresses input batches with compress-utils. */
  async *compressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    await this.preload();
    const module = this.module!;
    if (!module.createCompressStream) {
      yield await this.compress(await this.concatenate(inputBatches));
      return;
    }
    const stream = await module.createCompressStream!(this.options.compressUtils);
    yield* transformBatches(stream, inputBatches);
  }
}

/** Decompression-only binding for one independently imported compress-utils decoder. */
export class CompressUtilsDecompressor extends Decompressor {
  readonly name: string;
  readonly extensions: string[];
  readonly contentEncodings: string[];
  readonly isSupported = true;
  readonly options: CompressUtilsCompressionOptions;

  private readonly loadModule: () => Promise<CompressUtilsDecompressModule>;
  /** Module initialized for synchronous operations. */
  private module: CompressUtilsDecompressModule | null = null;
  /** Shared import and WASM initialization for concurrent callers. */
  private modulePromise: Promise<void> | null = null;

  /** Creates a format-specific compress-utils decoder. */
  constructor(
    metadata: CompressUtilsMetadata,
    loadModule: () => Promise<CompressUtilsDecompressModule>,
    options: CompressUtilsCompressionOptions = {}
  ) {
    super(options);
    this.name = metadata.name;
    this.extensions = metadata.extensions || [];
    this.contentEncodings = metadata.contentEncodings || [];
    this.loadModule = loadModule;
    this.options = options;
  }

  /** Imports and initializes the codec without loading the opposite direction. */
  async preload(modules: Record<string, any> = {}): Promise<void> {
    await super.preload(modules);
    this.modulePromise ||= this.loadModule().then(async module => {
      await module.preload?.();
      this.module = module;
    });
    try {
      await this.modulePromise;
    } catch (error) {
      this.modulePromise = null;
      throw error;
    }
  }

  /** Runs synchronously after preload has initialized the WASM codec. */
  decompressSync(input: ArrayBuffer, size?: number): ArrayBuffer {
    if (!this.module?.decompressSync)
      throw new Error(`${this.name}: call preload() before decompressSync()`);
    return copyDecompressedOutput(
      this.module.decompressSync(new Uint8Array(input), getDecompressOptions(this.options, size)),
      this.options
    );
  }

  /** Decompresses one buffer with the selected compress-utils decoder. */
  async decompress(input: ArrayBuffer, size?: number): Promise<ArrayBuffer> {
    const decodeOptions = getDecompressOptions(this.options, size);
    await this.preload();
    const module = this.module!;
    const output = await module.decompress(new Uint8Array(input), decodeOptions);
    return copyDecompressedOutput(output, this.options);
  }

  /** Incrementally decompresses input batches with compress-utils. */
  async *decompressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    await this.preload();
    const module = this.module!;
    if (!module.createDecompressStream) {
      yield await this.decompress(await this.concatenate(inputBatches));
      return;
    }
    const maximum = getMaximumOutputByteLength(this.options);
    const stream = await module.createDecompressStream!();
    yield* transformBatches(stream, inputBatches, maximum);
  }
}

/**
 * Base class for a combined compress-utils algorithm binding.
 *
 * @deprecated Import the matching direction-specific compress-utils compressor or decompressor.
 */
export class CompressUtilsCompression extends Compression {
  readonly name: string;
  readonly extensions: string[];
  readonly contentEncodings: string[];
  readonly isSupported = true;
  readonly options: CompressUtilsCompressionOptions;

  private readonly loadCompressModule: () => Promise<CompressUtilsCompressModule>;
  private readonly loadDecompressModule: () => Promise<CompressUtilsDecompressModule>;

  /** Creates a format-specific compress-utils binding. */
  constructor(
    metadata: CompressUtilsMetadata,
    loadCompressModule: () => Promise<CompressUtilsCompressModule>,
    loadDecompressModule: () => Promise<CompressUtilsDecompressModule>,
    options: CompressUtilsCompressionOptions = {}
  ) {
    super(options);
    this.name = metadata.name;
    this.extensions = metadata.extensions || [];
    this.contentEncodings = metadata.contentEncodings || [];
    this.loadCompressModule = loadCompressModule;
    this.loadDecompressModule = loadDecompressModule;
    this.options = options;
  }

  /** Compresses one buffer with the selected compress-utils encoder. */
  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    const module = await this.loadCompressModule();
    const output = await module.compress(new Uint8Array(input), this.options.compressUtils);
    return copyArrayBuffer(output);
  }

  /** Decompresses one buffer with the selected compress-utils decoder. */
  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    const module = await this.loadDecompressModule();
    const output = await module.decompress(new Uint8Array(input), this.options.compressUtils);
    return copyArrayBuffer(output);
  }

  /** Incrementally compresses input batches with compress-utils. */
  async *compressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const module = await this.loadCompressModule();
    const stream = await module.createCompressStream!(this.options.compressUtils);
    yield* transformBatches(stream, inputBatches);
  }

  /** Incrementally decompresses input batches with compress-utils. */
  async *decompressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const module = await this.loadDecompressModule();
    const stream = await module.createDecompressStream!();
    yield* transformBatches(stream, inputBatches);
  }
}

/** Streams ArrayBuffer batches through one compress-utils stream. */
async function* transformBatches(
  stream: CompressUtilsStream,
  inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  maximumOutputByteLength = Number.POSITIVE_INFINITY
): AsyncIterable<ArrayBuffer> {
  let outputByteLength = 0;
  try {
    for await (const input of inputBatches) {
      const output = stream.write(new Uint8Array(input));
      if (output.byteLength > maximumOutputByteLength - outputByteLength)
        throw new RangeError('Decompressed output exceeds maxOutputByteLength');
      outputByteLength += output.byteLength;
      if (output.byteLength > 0) yield copyArrayBuffer(output);
    }
    const output = stream.finish();
    if (output.byteLength > maximumOutputByteLength - outputByteLength)
      throw new RangeError('Decompressed output exceeds maxOutputByteLength');
    if (output.byteLength > 0) yield copyArrayBuffer(output);
  } finally {
    stream.destroy();
  }
}

/** Copies a typed array into an exact ArrayBuffer. */
function copyArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer as ArrayBuffer;
}

/** Validates caller capacities before the backend can preallocate WASM output memory. */
function getDecompressOptions(
  options: CompressUtilsCompressionOptions,
  size?: number
): Record<string, unknown> {
  const decodeOptions = {
    ...options.compressUtils,
    ...(size === undefined ? {} : {expectedSize: size})
  };
  const capacity = decodeOptions.expectedSize;
  const maximum = getMaximumOutputByteLength(options);
  if (
    capacity !== undefined &&
    (!Number.isSafeInteger(capacity) || (capacity as number) < 0 || (capacity as number) > maximum)
  ) {
    throw new RangeError('expectedSize exceeds the configured output capacity limit');
  }
  return decodeOptions;
}

/** Validates the per-decoder limit shared by atomic and incremental operations. */
function getMaximumOutputByteLength(options: CompressUtilsCompressionOptions): number {
  const maximum = options.maxOutputByteLength ?? 512 * 1024 * 1024;
  if (!Number.isSafeInteger(maximum) || maximum < 0 || maximum > 0x7fffffff)
    throw new RangeError('Invalid maxOutputByteLength');
  return maximum;
}

/** Checks actual decoded size, including codecs that can infer size without a capacity hint. */
function copyDecompressedOutput(
  bytes: Uint8Array,
  options: CompressUtilsCompressionOptions
): ArrayBuffer {
  if (bytes.byteLength > getMaximumOutputByteLength(options))
    throw new RangeError('Decompressed output exceeds maxOutputByteLength');
  return copyArrayBuffer(bytes);
}
