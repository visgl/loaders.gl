// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license
// Forked from https://github.com/ironSource/parquetjs under MIT license

import {
  BrotliCompressor,
  BrotliDecompressor,
  GZipCompressor,
  GZipDecompressor,
  LZ4Compressor,
  LZ4Decompressor,
  SnappyCompressor,
  SnappyDecompressor,
  ZstdCompressor,
  ZstdDecompressor,
  Decompressor,
  type Compressor
} from '@loaders.gl/compression';
import {SnappyHysnappyDecompressor} from '@loaders.gl/compression/snappy-decompressor-hysnappy';
import {registerJSModules} from '@loaders.gl/loader-utils';

import {ParquetCompression} from './schema/declare';
import {toArrayBuffer, toUint8Array} from './utils/binary-utils';

/**
 * See https://github.com/apache/parquet-format/blob/master/Compression.md
 */
export const PARQUET_COMPRESSION_METHODS: Partial<Record<ParquetCompression, true>> = {
  UNCOMPRESSED: true,
  GZIP: true,
  SNAPPY: true,
  BROTLI: true,
  // TODO: Understand difference between LZ4 and LZ4_RAW.
  LZ4: true,
  LZ4_RAW: true,
  ZSTD: true
};

/** Reader-scoped function that decompresses one independently encoded Parquet page. */
export type ParquetPageDecompressor = (value: Uint8Array, size: number) => Promise<Uint8Array>;

/** Fast Snappy decoder that permanently falls back to snappyjs when WASM is unavailable. */
class ParquetSnappyDecompressor extends Decompressor {
  /** Compression format name. */
  readonly name = 'snappy';
  /** Snappy does not have a standard standalone file extension. */
  readonly extensions: string[] = [];
  /** Snappy does not have a standard HTTP content encoding. */
  readonly contentEncodings: string[] = [];
  /** snappyjs keeps this composite decoder available without WebAssembly. */
  readonly isSupported = true;
  /** Preferred compact WASM decoder for page-sized frames. */
  private readonly hysnappy = new SnappyHysnappyDecompressor();
  /** Always-supported JavaScript decoder. */
  private readonly snappyjs = new SnappyDecompressor();
  /** Whether this instance has selected the JavaScript fallback. */
  private useSnappyjs = !this.hysnappy.isSupported;

  /** Decodes with hysnappy, retaining snappyjs after the first WASM setup or runtime failure. */
  override async decompress(input: ArrayBuffer, size?: number): Promise<ArrayBuffer> {
    if (!this.useSnappyjs) {
      try {
        return await this.hysnappy.decompress(input, size);
      } catch {
        // CSP can reject WebAssembly compilation even when the WebAssembly global exists. Once
        // that happens, avoid paying the same rejected initialization cost for every Parquet page.
        this.useSnappyjs = true;
      }
    }
    return await this.snappyjs.decompress(input, size);
  }
}

/**
 * Registers optional codec modules without eagerly loading codec-backed implementations.
 *
 * @param options.modules External library dependencies.
 */
export async function preloadCompressions(options?: {modules?: {[key: string]: any}}) {
  registerJSModules(options?.modules);
}

/**
 * Deflate a value using compression method `method`
 */
export async function deflate(method: ParquetCompression, value: Uint8Array): Promise<Uint8Array> {
  if (!(method in PARQUET_COMPRESSION_METHODS)) {
    throw new Error(`parquet: invalid compression method: ${method}`);
  }
  if (method === 'UNCOMPRESSED') {
    return value;
  }

  const compression = await getParquetCompressor(method);
  const inputArrayBuffer = toArrayBuffer(value);
  const compressedArrayBuffer = await compression.compress(inputArrayBuffer);
  return toUint8Array(compressedArrayBuffer);
}

/**
 * Inflate a value using compression method `method`
 */
export async function decompress(
  method: ParquetCompression,
  value: Uint8Array,
  size: number
): Promise<Uint8Array> {
  if (!(method in PARQUET_COMPRESSION_METHODS)) {
    throw new Error(`parquet: invalid compression method: ${method}`);
  }
  const inputArrayBuffer = toArrayBuffer(value);
  if (method === 'UNCOMPRESSED') {
    return toUint8Array(inputArrayBuffer);
  }

  const compression = await getParquetDecompressor(method);
  const compressedArrayBuffer = await compression.decompress(inputArrayBuffer, size);
  return toUint8Array(compressedArrayBuffer);
}

/**
 * Creates a reusable decoder for the independently compressed pages in one Parquet reader.
 *
 * Reusing the lazy codec preserves its selected backend and avoids repeating dynamic import and
 * preload work for every page while keeping module injection scoped to a reader invocation.
 */
export function createParquetPageDecompressor(method: ParquetCompression): ParquetPageDecompressor {
  const decompressor = method === 'UNCOMPRESSED' ? null : createParquetDecompressor(method);
  return async (value: Uint8Array, size: number): Promise<Uint8Array> => {
    const inputArrayBuffer = toArrayBuffer(value);
    if (!decompressor) {
      return toUint8Array(inputArrayBuffer);
    }
    const decompressedArrayBuffer = await decompressor.decompress(inputArrayBuffer, size);
    return toUint8Array(decompressedArrayBuffer);
  };
}

/** Returns a new lazily selecting compressor for one Parquet method. */
async function getParquetCompressor(method: ParquetCompression): Promise<Compressor> {
  return createParquetCompressor(method);
}

/** Returns a new lazily selecting decompressor for one Parquet method. */
async function getParquetDecompressor(method: ParquetCompression): Promise<Decompressor> {
  return createParquetDecompressor(method);
}

/** Creates the root-level default compressor for one Parquet method. */
function createParquetCompressor(method: ParquetCompression): Compressor {
  switch (method) {
    case 'GZIP':
      return new GZipCompressor();
    case 'SNAPPY':
      return new SnappyCompressor();
    case 'BROTLI':
      return new BrotliCompressor();
    case 'LZ4':
    case 'LZ4_RAW':
      return new LZ4Compressor();
    case 'ZSTD':
      return new ZstdCompressor();
    default:
      throw new Error(`parquet: invalid compression method: ${method}`);
  }
}

/** Creates the root-level default decompressor for one Parquet method. */
function createParquetDecompressor(method: ParquetCompression): Decompressor {
  switch (method) {
    case 'GZIP':
      return new GZipDecompressor();
    case 'SNAPPY':
      return new ParquetSnappyDecompressor();
    case 'BROTLI':
      return new BrotliDecompressor();
    case 'LZ4':
    case 'LZ4_RAW':
      return new LZ4Decompressor();
    case 'ZSTD':
      return new ZstdDecompressor();
    default:
      throw new Error(`parquet: invalid compression method: ${method}`);
  }
}
