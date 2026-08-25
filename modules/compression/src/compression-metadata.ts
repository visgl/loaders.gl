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

/** Metadata for no-op data. */
export const noCompression = createCompressionMetadata(
  'uncompressed',
  [],
  [],
  async () => (await import('./lib/no-compression')).NoCompression
);

/** Metadata for DEFLATE data. */
export const deflateCompression = createCompressionMetadata(
  'deflate',
  [],
  ['deflate'],
  async () => (await import('./lib/deflate-compression')).DeflateCompression
);

/** Metadata for GZIP data. */
export const gzipCompression = createCompressionMetadata(
  'gzip',
  ['gz'],
  ['gzip'],
  async () => (await import('./lib/gzip-compression')).GZipCompression
);

/** Metadata for Brotli data. */
export const brotliCompression = createCompressionMetadata(
  'brotli',
  ['br'],
  ['br'],
  async () => (await import('./lib/brotli-compression')).BrotliCompression
);

/** Metadata for Snappy data. */
export const snappyCompression = createCompressionMetadata(
  'snappy',
  [],
  [],
  async () => (await import('./lib/snappy-compression')).SnappyCompression
);

/** Metadata for LZ4 data. */
export const lz4Compression = createCompressionMetadata(
  'lz4',
  [],
  [],
  async () => (await import('./lib/lz4-compression')).LZ4Compression
);

/** Metadata for Zstandard data. */
export const zstdCompression = createCompressionMetadata(
  'zstd',
  [],
  [],
  async () => (await import('./lib/zstd-compression')).ZstdCompression
);

/** Metadata for bzip2 data. */
export const bzip2Compression = createCompressionMetadata(
  'bzip2',
  ['bz2'],
  ['bzip2'],
  async () => (await import('./lib/bzip2-compression')).BZip2Compression
);

/** Metadata for XZ/LZMA data. */
export const xzCompression = createCompressionMetadata(
  'xz',
  ['xz', 'lzma'],
  ['xz'],
  async () => (await import('./lib/xz-compression')).XZCompression
);
