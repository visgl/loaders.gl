// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createWorker} from '@loaders.gl/worker-utils';

type CompressionInstance = {
  compress(data: ArrayBuffer): Promise<ArrayBuffer>;
  decompress(data: ArrayBuffer): Promise<ArrayBuffer>;
};

createWorker(async (data, options = {}) => {
  const compression = await getCompression(String(options?.compression), options?.modules);
  switch (getOperation(String(options?.operation))) {
    case 'compress':
      return await compression.compress(data);
    case 'decompress':
      return await compression.decompress(data);
  }
});

function getOperation(operation: string): 'compress' | 'decompress' {
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
  modules?: Record<string, any>
): Promise<CompressionInstance> {
  switch (name) {
    case 'uncompressed': {
      const {NoCompression} = await import('../lib/no-compression');
      return new NoCompression({modules});
    }
    case 'deflate': {
      const {DeflateCompression} = await import('../lib/deflate-compression');
      return new DeflateCompression({modules});
    }
    case 'gzip': {
      const {GZipCompression} = await import('../lib/gzip-compression');
      return new GZipCompression({modules});
    }
    case 'brotli': {
      const {BrotliCompression} = await import('../lib/brotli-compression');
      return new BrotliCompression({modules});
    }
    case 'lz4': {
      const {LZ4Compression} = await import('../lib/lz4-compression');
      return new LZ4Compression({modules});
    }
    case 'snappy': {
      const {SnappyCompression} = await import('../lib/snappy-compression');
      return new SnappyCompression({modules});
    }
    case 'zstd': {
      const {ZstdCompression} = await import('../lib/zstd-compression');
      return new ZstdCompression({modules});
    }
    case 'bzip2': {
      const {BZip2Compression} = await import('../lib/bzip2-compression');
      return new BZip2Compression({modules});
    }
    case 'xz': {
      const {XZCompression} = await import('../lib/xz-compression');
      return new XZCompression({modules});
    }
    default:
      throw new Error(`@loaders.gl/compression: Unsupported compression ${name}`);
  }
}
