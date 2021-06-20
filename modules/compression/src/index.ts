import type {WorkerObject} from '@loaders.gl/worker-utils';

// Zlib (via Pako)
export {default as ZlibDeflateTransform} from './lib/zlib/zlib-deflate-transform';
export {default as ZlibInflateTransform} from './lib/zlib/zlib-inflate-transform';

// LZ4
export {default as LZ4DeflateTransform} from './lib/lz4/lz4-deflate-transform';
export {default as LZ4InflateTransform} from './lib/lz4/lz4-inflate-transform';

// Zstd - NOT exported due to size of Zstd library
// export {default as ZstdDeflateTransform} from './lib/zstd/zstd-deflate-transform';
// export {default as ZstdInflateTransform} from './lib/zstd/zstd-inflate-transform';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Worker for Zlib real-time compression and decompression
 */
export const ZlibWorker: WorkerObject = {
  id: 'zlib',
  name: 'zlib',
  module: 'compression',
  version: VERSION,
  options: {
    zlib: {
      // level
    }
  }
};

/**
 * Worker for LZ4 real-time compression and decompression
 */
export const LZ4Worker: WorkerObject = {
  id: 'lz4',
  name: 'lz4',
  module: 'compression',
  version: VERSION,
  options: {
    lz4: {
      // level
    }
  }
};

/**
 * Worker for Zstandard real-time compression and decompression
 * @note this is a large worker due to big Zstd-codec library.
 */
export const ZstdWorker: WorkerObject = {
  id: 'zstd',
  name: 'zstd',
  module: 'compression',
  version: VERSION,
  options: {
    zstd: {
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
