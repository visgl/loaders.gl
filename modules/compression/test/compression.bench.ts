// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/*
import {
  NoCompression,
  GZipCompression,
  DeflateCompression,
  LZ4Compression,
  ZstdCompression,
  SnappyCompression,
  BrotliCompression,
  LZOCompression,
  CompressionWorker
} from '@loaders.gl/compression';
import {getData} from './utils/test-utils';

// import brotli from 'brotli'; - brotli has problems with decompress in browsers
import brotliDecompress from 'brotli/decompress';
import lz4js from 'lz4js';
import lzo from 'lzo';
import {ZstdCodec} from 'zstd-codec';

// Inject large dependencies through Compression constructor options
const modules = {
  // brotli has problems with decompress in browsers
  brotli: {
    decompress: brotliDecompress,
    compress: () => {
      throw new Error('brotli compress');
    }
  },
  lz4js,
  lzo,
  'zstd-codec': ZstdCodec
};

export default async function compressionBench(bench) {
  // const {binaryData} = getData();

  bench = bench.group('Compression');

  // bench = bench.addAsync('SHA256Hash#hash()', {multiplier: 100000, unit: 'bytes'}, () =>
  //   new SHA256Hash({modules: {CryptoJS}}).hash(binaryData)
  // );

  return bench;
}
*/
