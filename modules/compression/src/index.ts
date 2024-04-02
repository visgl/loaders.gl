// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {CompressionOptions} from './lib/compression';

export {Compression} from './lib/compression';

export {NoCompression} from './lib/no-compression';
export {DeflateCompression} from './lib/deflate-compression';
export {GZipCompression} from './lib/gzip-compression';
export {BrotliCompression} from './lib/brotli-compression';
export {SnappyCompression} from './lib/snappy-compression';
export {LZ4Compression} from './lib/lz4-compression';
export {ZstdCompression} from './lib/zstd-compression';
export {LZOCompression} from './lib/lzo-compression';

export type {CompressionWorkerOptions} from './compress-on-worker';
export {CompressionWorker, compressOnWorker} from './compress-on-worker';
