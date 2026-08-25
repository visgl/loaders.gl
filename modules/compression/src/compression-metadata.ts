// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Compression, CompressionOptions} from './lib/compression';
import type {CompressionMetadata} from './compression-types';

type CompressionConstructor = new (
  options?: CompressionOptions & Record<string, any>
) => Compression;

/** Creates lazy metadata for a concrete compression implementation. */
function createCompressionMetadata(
  name: string,
  extensions: readonly string[],
  contentEncodings: readonly string[],
  loadCompression: () => Promise<CompressionConstructor>
): CompressionMetadata {
  return {
    name,
    extensions,
    contentEncodings,
    isSupported: true,
    async preload(options = {}): Promise<Compression> {
      const CompressionConstructor = await loadCompression();
      const compression = new CompressionConstructor(options);
      await compression.preload(options.modules);
      return compression;
    }
  };
}

/** @deprecated Use `NoCompressor` or `NoDecompressor`. */
export const noCompression = createCompressionMetadata(
  'uncompressed',
  [],
  [],
  async () => (await import('./lib/no-compression')).NoCompression
);

/** @deprecated Use `DeflateCompressor` or `DeflateDecompressor`. */
export const deflateCompression = createCompressionMetadata(
  'deflate',
  [],
  ['deflate'],
  async () => (await import('./lib/deflate-compression')).DeflateCompression
);

/** @deprecated Use `GZipCompressor` or `GZipDecompressor`. */
export const gzipCompression = createCompressionMetadata(
  'gzip',
  ['gz'],
  ['gzip'],
  async () => (await import('./lib/gzip-compression')).GZipCompression
);

/** @deprecated Use `BrotliCompressor` or `BrotliDecompressor`. */
export const brotliCompression = createCompressionMetadata(
  'brotli',
  ['br'],
  ['br'],
  async () => (await import('./lib/brotli-compression')).BrotliCompression
);

/** @deprecated Use `SnappyCompressor` or `SnappyDecompressor`. */
export const snappyCompression = createCompressionMetadata(
  'snappy',
  [],
  [],
  async () => (await import('./lib/snappy-compression')).SnappyCompression
);

/** @deprecated Use `LZ4Compressor` or `LZ4Decompressor`. */
export const lz4Compression = createCompressionMetadata(
  'lz4',
  [],
  [],
  async () => (await import('./lib/lz4-compression')).LZ4Compression
);

/** @deprecated Use `ZstdCompressor` or `ZstdDecompressor`. */
export const zstdCompression = createCompressionMetadata(
  'zstd',
  [],
  [],
  async () => (await import('./lib/zstd-compression')).ZstdCompression
);

/** @deprecated Use `BZip2Compressor` or `BZip2Decompressor`. */
export const bzip2Compression = createCompressionMetadata(
  'bzip2',
  ['bz2'],
  ['bzip2'],
  async () => (await import('./lib/bzip2-compression')).BZip2Compression
);

/** @deprecated Use `XZCompressor` or `XZDecompressor`. */
export const xzCompression = createCompressionMetadata(
  'xz',
  ['xz', 'lzma'],
  ['xz'],
  async () => (await import('./lib/xz-compression')).XZCompression
);
