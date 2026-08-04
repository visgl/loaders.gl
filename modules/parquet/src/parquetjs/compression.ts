// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license
// Forked from https://github.com/ironSource/parquetjs under MIT license

import type {Compression} from '@loaders.gl/compression';
import {
  decompressWithNativeDecompressionStream,
  type NativeDecompressionFormat
} from '@loaders.gl/compression/native-decompression';
import {getJSModuleOrNull, registerJSModules} from '@loaders.gl/loader-utils';

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

/** Native formats available to asynchronous Parquet page decompression. */
const PARQUET_NATIVE_DECOMPRESSION_FORMATS: Partial<
  Record<ParquetCompression, NativeDecompressionFormat>
> = {
  GZIP: 'gzip',
  BROTLI: 'brotli',
  ZSTD: 'zstd'
};

/** Lazily constructed codec-backed compression implementations. */
const compressionPromises: Partial<Record<ParquetCompression, Promise<Compression>>> = {};

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

  const compression = await getParquetCompression(method);
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

  const nativeFormat = PARQUET_NATIVE_DECOMPRESSION_FORMATS[method];
  if (nativeFormat && shouldUseNativeDecompressionStream(method)) {
    const nativeOutput = await decompressWithNativeDecompressionStream(
      inputArrayBuffer,
      nativeFormat
    );
    if (nativeOutput) {
      return toUint8Array(nativeOutput);
    }
  }

  const compression = await getParquetCompression(method);
  const compressedArrayBuffer = await compression.decompress(inputArrayBuffer, size);
  return toUint8Array(compressedArrayBuffer);
}

/**
 * Returns whether a native stream can take precedence for one Parquet compression method.
 *
 * @param method Parquet compression method.
 * @returns Whether no explicitly registered codec should take precedence.
 */
function shouldUseNativeDecompressionStream(method: ParquetCompression): boolean {
  if (method === 'BROTLI') {
    return !getJSModuleOrNull('brotli');
  }
  if (method === 'ZSTD') {
    return !getJSModuleOrNull('zstd-codec');
  }
  return true;
}

/**
 * Loads one codec-backed implementation only after native decompression is unavailable.
 *
 * @param method Parquet compression method.
 * @returns Codec-backed compression implementation.
 */
async function getParquetCompression(method: ParquetCompression): Promise<Compression> {
  compressionPromises[method] ||= createParquetCompression(method);
  return await compressionPromises[method];
}

/**
 * Creates one lazily loaded codec-backed Parquet compression implementation.
 *
 * @param method Parquet compression method.
 * @returns Codec-backed compression implementation.
 */
async function createParquetCompression(method: ParquetCompression): Promise<Compression> {
  switch (method) {
    case 'GZIP': {
      const {GZipCompression} = await import('@loaders.gl/compression/gzip-compression');
      return new GZipCompression();
    }
    case 'SNAPPY': {
      const {SnappyCompression} = await import('@loaders.gl/compression/snappy-compression');
      return new SnappyCompression();
    }
    case 'BROTLI': {
      const {BrotliCompression} = await import('@loaders.gl/compression/brotli-compression');
      return new BrotliCompression();
    }
    case 'LZ4':
    case 'LZ4_RAW': {
      const {LZ4Compression} = await import('@loaders.gl/compression/lz4-compression');
      const lz4js = getJSModuleOrNull('lz4js') || (await import('lz4js')).default;
      return new LZ4Compression({modules: {lz4js}});
    }
    case 'ZSTD': {
      const {ZstdCompression} = await import('@loaders.gl/compression/zstd-compression');
      return new ZstdCompression();
    }
    default:
      throw new Error(`parquet: invalid compression method: ${method}`);
  }
}
