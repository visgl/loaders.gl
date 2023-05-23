export type {CompressionOptions} from './lib/compression';

export {Compression} from './lib/compression';

export {NoCompression} from './lib/no-compression';

export {DeflateCompression} from './lib/deflate-compression-pako';
export {DeflateCompressionZlib} from './lib/deflate-compression-zlib';
export {GZipCompression} from './lib/gzip-compression-pako';
export {GZipCompressionZlib} from './lib/gzip-compression-zlib';

export {BrotliCompression} from './lib/brotli-compression';
export {BrotliCompressionZlib} from './lib/brotli-compression-zlib';

export {SnappyCompression} from './lib/snappy-compression';

export {LZ4Compression} from './lib/lz4-compression';

export {ZstdCompression} from './lib/zstd-compression';

export {LZOCompression} from './lib/lzo-compression';

export type {CompressionWorkerOptions} from './compression-worker';
export {CompressionWorker, compressOnWorker} from './compression-worker';

// Versions
export {DeflateCompression as _DeflateCompressionFflate} from './lib/deflate-compression-fflate';
export {GZipCompression as _GZipCompressionFflate} from './lib/gzip-compression-fflate';

export {DeflateCompression as _DeflateCompressionPako} from './lib/deflate-compression-pako';
export {GZipCompression as _GZipCompressionPako} from './lib/gzip-compression-pako';
