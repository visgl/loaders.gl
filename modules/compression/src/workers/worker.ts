import {createWorker} from '@loaders.gl/worker-utils';

// Compressors
import {NoCompression} from '../lib/no-compression';
import {BrotliCompression} from '../lib/brotli-compression';
import {DeflateCompression} from '../lib/deflate-compression';
import {GZipCompression} from '../lib/gzip-compression';
import {LZ4Compression} from '../lib/lz4-compression';
import {LZOCompression} from '../lib/lzo-compression';
import {SnappyCompression} from '../lib/snappy-compression';
import {ZstdCompression} from '../lib/zstd-compression';

// Compression libraries
// import brotli from 'brotli';
import {ZstdCodec} from 'zstd-codec';

// Bundle in the big Zstd-Codec in the worker
// eslint-disable-next-line import/no-extraneous-dependencies

const COMPRESSIONS = [
  NoCompression,
  BrotliCompression,
  DeflateCompression,
  GZipCompression,
  LZ4Compression,
  LZOCompression,
  SnappyCompression,
  ZstdCompression
];

const modules = {
  'zstd-codec': ZstdCodec
  // brotli
};

createWorker(async (data, options = {}) => {
  const operation = getOperation(String(options?.operation));
  const Compression = getCompression(String(options?.compression));

  // @ts-ignore
  switch (operation) {
    case 'compress':
      return await new Compression({modules}).compress(data);
    case 'decompress':
      return await new Compression({modules}).decompress(data);
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
  const Compression = COMPRESSIONS.find(compression_ => name === compression_.name);
  if (!Compression) {
    throw new Error(`@loaders.gl/compression: Unsupported compression ${name}`);
  }
  return Compression;
}
