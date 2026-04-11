// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license
// Forked from https://github.com/ironSource/parquetjs under MIT license

import {
  Compression,
  NoCompression,
  GZipCompression,
  SnappyCompression,
  BrotliCompression,
  // LZOCompression,
  LZ4Compression,
  ZstdCompression
} from '@loaders.gl/compression';
import {registerJSModules} from '@loaders.gl/loader-utils';

import {ParquetCompression} from './schema/declare';
import {toArrayBuffer, toUint8Array} from './utils/binary-utils';

// TODO switch to worker compression to avoid bundling...

// import brotli from 'brotli'; - brotli has problems with decompress in browsers
// import brotliDecompress from 'brotli/decompress';
import lz4js from 'lz4js';
// import lzo from 'lzo';
// import {ZstdCodec} from 'zstd-codec';

// Inject large dependencies through Compression constructor options
const modules = {
  // brotli has problems with decompress in browsers
  // brotli: {
  //   decompress: brotliDecompress,
  //   compress: () => {
  //     throw new Error('brotli compress');
  //   }
  // },
  lz4js
  // lzo
  // 'zstd-codec': ZstdCodec
};

/**
 * See https://github.com/apache/parquet-format/blob/master/Compression.md
 */
// @ts-expect-error
export const PARQUET_COMPRESSION_METHODS: Record<ParquetCompression, Compression> = {
  UNCOMPRESSED: new NoCompression(),
  GZIP: new GZipCompression(),
  SNAPPY: new SnappyCompression(),
  BROTLI: new BrotliCompression({modules}),
  // TODO: Understand difference between LZ4 and LZ4_RAW
  LZ4: new LZ4Compression({modules}),
  LZ4_RAW: new LZ4Compression({modules}),
  //
  // LZO: new LZOCompression({modules}),
  ZSTD: new ZstdCompression({modules})
};

/**
 * Register compressions that have big external libraries
 * @param options.modules External library dependencies
 */
export async function preloadCompressions(options?: {modules?: {[key: string]: any}}) {
  registerJSModules(options?.modules);
  const compressions = Object.values(PARQUET_COMPRESSION_METHODS);
  return await Promise.all(compressions.map(compression => compression.preload(options?.modules)));
}

/**
 * Deflate a value using compression method `method`
 */
export async function deflate(method: ParquetCompression, value: Uint8Array): Promise<Uint8Array> {
  const compression = PARQUET_COMPRESSION_METHODS[method];
  if (!compression) {
    throw new Error(`parquet: invalid compression method: ${method}`);
  }
  const inputArrayBuffer = toArrayBuffer(value);
  const compressedArrayBuffer = await compression.compress(inputArrayBuffer);
  return toUint8Array(compressedArrayBuffer);
}

/**
 * Inflate a value using compression method `method`
 */
export async function decompress(
  method: ParquetCompression,
  value: Uint8Array,
  size: number
): Promise<Uint8Array> {
  const compression = PARQUET_COMPRESSION_METHODS[method];
  if (!compression) {
    throw new Error(`parquet: invalid compression method: ${method}`);
  }
  const inputArrayBuffer = toArrayBuffer(value);
  const compressedArrayBuffer = await compression.decompress(inputArrayBuffer, size);
  return toUint8Array(compressedArrayBuffer);
}
