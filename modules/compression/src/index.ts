// import type {Worker} from '@loaders.gl/worker-utils';

export type {CompressionOptions} from './lib/compression';

export {Compression} from './lib/compression';
export {NoCompression} from './lib/no-compression';
export {DeflateCompression} from './lib/deflate-compression';
export {GZipCompression} from './lib/gzip-compression';
export {LZ4Compression} from './lib/lz4-compression';
export {ZstdCompression} from './lib/zstd-compression';
export {SnappyCompression} from './lib/snappy-compression';
export {BrotliCompression} from './lib/brotli-compression';
export {LZOCompression} from './lib/lzo-compression';

// Zstd - NOT exported due to size of Zstd library
// export {default as ZstdDeflateTransform} from './lib/zstd/zstd-deflate-transform';
// export {default as ZstdInflateTransform} from './lib/zstd/zstd-inflate-transform';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type CompressionWorkerOptions = {
  compression: string;
  operation: 'compress' | 'decompress';
};

/**
 * Worker for Zlib real-time compression and decompression
 */
export const CompressionWorker = {
  id: 'compression',
  name: 'compression',
  module: 'compression',
  version: VERSION,
  options: {
    zlib: {
      // level
    }
  }
};

/**
 * Overload parseOnWorker to provide type safety
export function parseOnWorker(
  worker: ZlibWorker | LZ4Worker | ZstdWorker,
  data: ArrayBuffer,
  options?: object
): Promise<ArrayBuffer>;
 */

// export const _typecheckZlibWorker: Worker = ZlibWorker;
// export const _typecheckLZ4Worker: Worker = LZ4Worker;
// export const _typecheckZstdWorker: Worker = ZstdWorker;
