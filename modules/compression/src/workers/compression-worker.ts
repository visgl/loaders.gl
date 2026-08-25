// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createWorker} from '@loaders.gl/worker-utils';

type CompressionOperation = 'compress' | 'decompress';
type CompressionTransform = {
  compress?(data: ArrayBuffer): Promise<ArrayBuffer>;
  decompress?(data: ArrayBuffer): Promise<ArrayBuffer>;
};

createWorker(async (data, options = {}) => {
  const operation = getOperation(String(options?.operation));
  const compression = await getCompression(
    String(options?.compression),
    operation,
    options?.modules
  );
  switch (operation) {
    case 'compress':
      return await compression.compress!(data);
    case 'decompress':
      return await compression.decompress!(data);
  }
});

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
  modules?: Record<string, any>
): Promise<CompressionTransform> {
  switch (name) {
    case 'uncompressed': {
      if (operation === 'compress') {
        const {NoCompressor} = await import('../no-compressor');
        return new NoCompressor({modules});
      }
      const {NoDecompressor} = await import('../no-decompressor');
      return new NoDecompressor({modules});
    }
    case 'deflate': {
      if (operation === 'compress') {
        const {DeflateCompressor} = await import('../deflate-compressor');
        return new DeflateCompressor({modules});
      }
      const {DeflateDecompressor} = await import('../deflate-decompressor');
      return new DeflateDecompressor({modules});
    }
    case 'gzip': {
      if (operation === 'compress') {
        const {GZipCompressor} = await import('../gzip-compressor');
        return new GZipCompressor({modules});
      }
      const {GZipDecompressor} = await import('../gzip-decompressor');
      return new GZipDecompressor({modules});
    }
    case 'brotli': {
      if (operation === 'compress') {
        const {BrotliCompressor} = await import('../brotli-compressor');
        return new BrotliCompressor({modules});
      }
      const {BrotliDecompressor} = await import('../brotli-decompressor');
      return new BrotliDecompressor({modules});
    }
    case 'lz4': {
      if (operation === 'compress') {
        const {LZ4Compressor} = await import('../lz4-compressor');
        return new LZ4Compressor({modules});
      }
      const {LZ4Decompressor} = await import('../lz4-decompressor');
      return new LZ4Decompressor({modules});
    }
    case 'snappy': {
      if (operation === 'compress') {
        const {SnappyCompressor} = await import('../snappy-compressor');
        return new SnappyCompressor({modules});
      }
      const {SnappyDecompressor} = await import('../snappy-decompressor');
      return new SnappyDecompressor({modules});
    }
    case 'zstd': {
      if (operation === 'compress') {
        const {ZstdCompressor} = await import('../zstd-compressor');
        return new ZstdCompressor({modules});
      }
      const {ZstdDecompressor} = await import('../zstd-decompressor');
      return new ZstdDecompressor({modules});
    }
    case 'bzip2': {
      if (operation === 'compress') {
        const {BZip2Compressor} = await import('../bzip2-compressor');
        return new BZip2Compressor({modules});
      }
      const {BZip2Decompressor} = await import('../bzip2-decompressor');
      return new BZip2Decompressor({modules});
    }
    case 'xz': {
      if (operation === 'compress') {
        const {XZCompressor} = await import('../xz-compressor');
        return new XZCompressor({modules});
      }
      const {XZDecompressor} = await import('../xz-decompressor');
      return new XZDecompressor({modules});
    }
    default:
      throw new Error(`@loaders.gl/compression: Unsupported compression ${name}`);
  }
}
