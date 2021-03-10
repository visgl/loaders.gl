import {WorkerObject} from '@loaders.gl/worker-utils';

// Zlib (via Pako)
export {default as ZlibDeflateTransform} from './lib/zlib/zlib-deflate-transform';
export {default as ZlibInflateTransform} from './lib/zlib/zlib-inflate-transform';

// LZ4
export {default as LZ4DeflateTransform} from './lib/lz4/lz4-deflate-transform';
export {default as LZ4InflateTransform} from './lib/lz4/lz4-inflate-transform';

// Zstd - NOT exported due to size of Zstd library
// export {default as ZstdDeflateTransform} from './lib/zstd/zstd-deflate-transform';
// export {default as ZstdInflateTransform} from './lib/zstd/zstd-inflate-transform';

export interface CompressionWorkerObject extends WorkerObject {}

/**
 * Worker for Zlib real-time compression and decompression
 */
export const ZlibWorker: CompressionWorkerObject;

/**
 * Worker for LZ4 real-time compression and decompression
 */
export const LZ4Worker: CompressionWorkerObject;

/**
 * Worker for Zstandard real-time compression and decompression
 * @note this is a large worker due to big Zstd-codec library.
 */
export const ZstdWorker: CompressionWorkerObject;

// Overload parseOnWorker to provide type safety
export function parseOnWorker(
  worker: CompressionWorkerObject, data: ArrayBuffer, options?: object
): Promise<ArrayBuffer>;
