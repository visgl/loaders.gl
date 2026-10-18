// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CompressionOptions} from '../lib/compression';
import {createWorker} from '@loaders.gl/core/worker-utils';

type CompressionOperation = 'compress' | 'decompress';
type CompressionTransform = {
  compress?(data: ArrayBuffer): Promise<ArrayBuffer>;
  decompress?(data: ArrayBuffer, size?: number): Promise<ArrayBuffer>;
};

/** Processes one compression worker request. */
export async function processCompressionWorkerRequest(data: ArrayBuffer, options: any = {}) {
  const operation = getOperation(String(options?.operation));
  const compression = await getCompression(String(options?.compression), operation, {
    modules: options?.modules,
    compressUtils: options?.compressUtils,
    maxOutputByteLength: options?.maxOutputByteLength,
    raw: options?.raw,
    useNative: options?.useNative
  });
  switch (operation) {
    case 'compress':
      return await compression.compress!(data);
    case 'decompress':
      return await compression.decompress!(data, options?.expectedSize);
  }
}

createWorker(processCompressionWorkerRequest);

function getOperation(operation: string): CompressionOperation {
  switch (operation) {
    case 'compress':
    case 'deflate':
      return 'compress';
    case 'decompress':
    case 'inflate':
      return 'decompress';
    default:
      throw new Error(
        `@loaders.gl/compression: Unsupported operation ${operation}. Expected 'compress' or 'decompress'`
      );
  }
}

async function getCompression(
  name: string,
  operation: CompressionOperation,
  options: CompressionOptions = {}
): Promise<CompressionTransform> {
  switch (name) {
    case 'uncompressed': {
      if (operation === 'compress') {
        const {NoCompressor} = await import('../no-compressor');
        return new NoCompressor(options);
      }
      const {NoDecompressor} = await import('../no-decompressor');
      return new NoDecompressor(options);
    }
    case 'deflate': {
      if (operation === 'compress') {
        const {DeflateCompressor} = await import('../deflate-compressor');
        return new DeflateCompressor(options);
      }
      const {DeflateDecompressor} = await import('../deflate-decompressor');
      return new DeflateDecompressor(options);
    }
    case 'gzip': {
      if (operation === 'compress') {
        const {GZipCompressor} = await import('../gzip-compressor');
        return new GZipCompressor(options);
      }
      const {GZipDecompressor} = await import('../gzip-decompressor');
      return new GZipDecompressor(options);
    }
    case 'brotli': {
      if (operation === 'compress') {
        const {BrotliCompressor} = await import('../brotli-compressor');
        return new BrotliCompressor(options);
      }
      const {BrotliDecompressor} = await import('../brotli-decompressor');
      return new BrotliDecompressor(options);
    }
    case 'lz4': {
      if (operation === 'compress') {
        const {LZ4Compressor} = await import('../lz4-compressor');
        return new LZ4Compressor(options);
      }
      const {LZ4Decompressor} = await import('../lz4-decompressor');
      return new LZ4Decompressor(options);
    }
    case 'snappy': {
      if (operation === 'compress') {
        const {SnappyCompressor} = await import('../snappy-compressor');
        return new SnappyCompressor(options);
      }
      const {SnappyDecompressor} = await import('../snappy-decompressor');
      return new SnappyDecompressor(options);
    }
    case 'zstd': {
      if (operation === 'compress') {
        const {ZstdCompressor} = await import('../zstd-compressor');
        return new ZstdCompressor(options);
      }
      const {ZstdDecompressor} = await import('../zstd-decompressor');
      return new ZstdDecompressor(options);
    }
    case 'bzip2': {
      if (operation === 'compress') {
        const {BZip2Compressor} = await import('../bzip2-compressor');
        return new BZip2Compressor(options);
      }
      const {BZip2Decompressor} = await import('../bzip2-decompressor');
      return new BZip2Decompressor(options);
    }
    case 'lzo': {
      if (operation === 'compress') throw new Error('LZO compression is not supported');
      const {LzoDecompressor} = await import('../lzo-decompressor');
      return new LzoDecompressor(options);
    }
    case 'xz': {
      if (operation === 'compress') {
        const {XZCompressor} = await import('../xz-compressor');
        return new XZCompressor(options);
      }
      const {XZDecompressor} = await import('../xz-decompressor');
      return new XZDecompressor(options);
    }
    default:
      throw new Error(`@loaders.gl/compression: Unsupported compression ${name}`);
  }
}
