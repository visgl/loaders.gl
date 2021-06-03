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

/**
 * Worker for Zlib real-time compression and decompression
 */
export const ZlibWorker: WorkerObject;

/**
 * Worker for LZ4 real-time compression and decompression
 */
export const LZ4Worker: WorkerObject;

/**
 * Worker for Zstandard real-time compression and decompression
 * @note this is a large worker due to big Zstd-codec library.
 */
export declare const ZstdWorker: WorkerObject;

/**
 * Overload parseOnWorker to provide type safety
export function parseOnWorker(
  worker: ZlibWorker | LZ4Worker | ZstdWorker,
  data: ArrayBuffer,
  options?: object
): Promise<ArrayBuffer>;
 */
