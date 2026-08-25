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
  compress(input: Uint8Array, options?: Record<string, unknown>): Promise<Uint8Array>;
  createCompressStream(options?: Record<string, unknown>): Promise<CompressUtilsStream>;
};

type CompressUtilsDecompressModule = {
  decompress(input: Uint8Array, options?: Record<string, unknown>): Promise<Uint8Array>;
  createDecompressStream(): Promise<CompressUtilsStream>;
};

/** Options shared by the optional compress-utils codec bindings. */
export type CompressUtilsCompressionOptions = CompressionOptions & {
  /** Options passed to the compress-utils encoder or decoder. */
  compressUtils?: Record<string, unknown>;
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

  /** Compresses one buffer with the selected compress-utils encoder. */
  async compress(input: ArrayBuffer): Promise<ArrayBuffer> {
    const module = await this.loadModule();
    const output = await module.compress(new Uint8Array(input), this.options.compressUtils);
    return copyArrayBuffer(output);
  }

  /** Incrementally compresses input batches with compress-utils. */
  async *compressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const module = await this.loadModule();
    const stream = await module.createCompressStream(this.options.compressUtils);
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

  /** Decompresses one buffer with the selected compress-utils decoder. */
  async decompress(input: ArrayBuffer): Promise<ArrayBuffer> {
    const module = await this.loadModule();
    const output = await module.decompress(new Uint8Array(input), this.options.compressUtils);
    return copyArrayBuffer(output);
  }

  /** Incrementally decompresses input batches with compress-utils. */
  async *decompressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const module = await this.loadModule();
    const stream = await module.createDecompressStream();
    yield* transformBatches(stream, inputBatches);
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
    const stream = await module.createCompressStream(this.options.compressUtils);
    yield* transformBatches(stream, inputBatches);
  }

  /** Incrementally decompresses input batches with compress-utils. */
  async *decompressBatches(
    inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    const module = await this.loadDecompressModule();
    const stream = await module.createDecompressStream();
    yield* transformBatches(stream, inputBatches);
  }
}

/** Streams ArrayBuffer batches through one compress-utils stream. */
async function* transformBatches(
  stream: CompressUtilsStream,
  inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
): AsyncIterable<ArrayBuffer> {
  try {
    for await (const input of inputBatches) {
      const output = stream.write(new Uint8Array(input));
      if (output.byteLength > 0) yield copyArrayBuffer(output);
    }
    const output = stream.finish();
    if (output.byteLength > 0) yield copyArrayBuffer(output);
  } finally {
    stream.destroy();
  }
}

/** Copies a typed array into an exact ArrayBuffer. */
function copyArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer as ArrayBuffer;
}
