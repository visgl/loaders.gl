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
  LzoDecompressor,
  SnappyCompressor,
  SnappyDecompressor,
  ZstdCompressor,
  ZstdDecompressor,
  Decompressor,
  type Compressor
} from '@loaders.gl/compression';
import {concatenateArrayBuffers, registerJSModules} from '@loaders.gl/loader-utils';

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
  LZO: true,
  LZ4: true,
  LZ4_RAW: true,
  ZSTD: true
};

/** Reader-scoped function that decompresses one independently encoded Parquet page. */
export type ParquetPageDecompressor = (value: Uint8Array, size: number) => Promise<Uint8Array>;

/** Decodes raw pages and the Hadoop framing emitted by parquet-java's LzoCodec. */
class ParquetLzoDecompressor extends LzoDecompressor {
  /** Prefers raw LZO1X and accepts complete, size-checked Hadoop block streams. */
  override async decompress(input: ArrayBuffer, size?: number): Promise<ArrayBuffer> {
    try {
      return await super.decompress(input, size);
    } catch (error) {
      // The raw decoder validates capacity before allocating. Preserve those errors rather than
      // attempting a framed allocation with an invalid or excessive page size.
      if (
        error instanceof RangeError ||
        !Number.isSafeInteger(size) ||
        size! < 0 ||
        size! > 0x7fffffff
      )
        throw error;
      const output = this.decodeHadoopBlocks(new Uint8Array(input), size!);
      if (output === null) throw error;
      return output;
    }
  }

  /** Checks each block/chunk length and decodes chunks until their block size is satisfied. */
  private decodeHadoopBlocks(input: Uint8Array, size: number): ArrayBuffer | null {
    const view = new DataView(input.buffer, input.byteOffset, input.byteLength);
    const chunks: ArrayBuffer[] = [];
    let inputOffset = 0;
    let outputOffset = 0;
    try {
      while (inputOffset < input.length) {
        if (input.length - inputOffset < 4) return null;
        const blockSize = view.getUint32(inputOffset, false);
        inputOffset += 4;
        if (blockSize === 0) {
          return inputOffset === input.length && outputOffset === size
            ? concatenateArrayBuffers(...chunks)
            : null;
        }
        if (blockSize > size - outputOffset) return null;
        const blockEnd = outputOffset + blockSize;
        while (outputOffset < blockEnd) {
          if (input.length - inputOffset < 4) return null;
          const chunkSize = view.getUint32(inputOffset, false);
          inputOffset += 4;
          if (chunkSize === 0 || chunkSize > input.length - inputOffset) return null;
          const chunk = input.slice(inputOffset, inputOffset + chunkSize);
          inputOffset += chunkSize;
          const decoded = new Uint8Array(
            this.decompressSync(chunk.buffer, blockEnd - outputOffset)
          );
          if (decoded.length === 0) return null;
          chunks.push(decoded.buffer as ArrayBuffer);
          outputOffset += decoded.length;
        }
      }
      return outputOffset === size ? concatenateArrayBuffers(...chunks) : null;
    } catch {
      return null;
    }
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
    case 'LZO':
      throw new Error('parquet: LZO compression is decode-only');
    case 'GZIP':
      return new GZipCompressor();
    case 'SNAPPY':
      return new SnappyCompressor();
    case 'BROTLI':
      return new BrotliCompressor();
    case 'LZ4':
      return new LZ4Compressor();
    case 'LZ4_RAW':
      return new LZ4Compressor({raw: true});
    case 'ZSTD':
      return new ZstdCompressor();
    default:
      throw new Error(`parquet: invalid compression method: ${method}`);
  }
}

/** Creates the root-level default decompressor for one Parquet method. */
function createParquetDecompressor(method: ParquetCompression): Decompressor {
  switch (method) {
    case 'LZO':
      return new ParquetLzoDecompressor();
    case 'GZIP':
      return new GZipDecompressor();
    case 'SNAPPY':
      return new SnappyDecompressor();
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
