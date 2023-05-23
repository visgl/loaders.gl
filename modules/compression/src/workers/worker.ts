import {createWorker} from '@loaders.gl/worker-utils';

import type {Compression} from '../lib/compression';

// Compressors
import {NoCompression} from '../lib/no-compression';
import {BrotliCompression} from '../lib/brotli-compression';
import {DeflateCompression} from '../lib/deflate-compression-pako';
import {GZipCompression} from '../lib/gzip-compression-pako';
import {LZ4Compression} from '../lib/lz4-compression';
// import {LZOCompression} from '../lib/lzo-compression';
import {SnappyCompression} from '../lib/snappy-compression';
import {ZstdCompression} from '../lib/zstd-compression';

// Import big dependencies

// import brotli from 'brotli'; - brotli has problems with decompress in browsers
import brotliDecompress from 'brotli/decompress';
import lz4js from 'lz4js';
// import lzo from 'lzo';
// import {ZstdCodec} from 'zstd-codec';

// globalThis.Worker = globalThis.Worker || {};
// globalThis.Blob = globalThis.Blob || {};

// Inject large dependencies through Compression constructor options
const modules = {
  // brotli has problems with decompress in browsers
  brotli: {
    decompress: brotliDecompress,
    compress: () => {
      throw new Error('brotli compress');
    }
  },
  lz4js
  // 'zstd-codec': ZstdCodec,
  // lzo,
};

const COMPRESSIONS: Compression[] = [
  new NoCompression({modules}),
  new BrotliCompression({modules}),
  new DeflateCompression({modules}),
  new GZipCompression({modules}),
  new SnappyCompression({modules}),
  new LZ4Compression({modules}),
  new ZstdCompression({modules})
  // new LZOCompression({modules})
];

createWorker(async (data, options = {}) => {
  const operation = getOperation(String(options?.operation));
  const compression = getCompression(String(options?.compression));

  // @ts-ignore
  switch (operation) {
    case 'compress':
      return await compression.compress(data);
    case 'decompress':
      return await compression.decompress(data);
    default:
      throw new Error('invalid option');
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

function getCompression(name: string) {
  const Compression = COMPRESSIONS.find((compression_) => name === compression_.name);
  if (!Compression) {
    throw new Error(`@loaders.gl/compression: Unsupported compression ${name}`);
  }
  return Compression;
}
