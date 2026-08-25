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
  type Compressor,
  type Decompressor
} from '@loaders.gl/compression';
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
