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

export type {CompressionWorkerOptions} from './compression-worker';
export {CompressionWorker, compressOnWorker} from './compression-worker';
