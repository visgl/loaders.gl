// Forked from https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.)
/* eslint-disable camelcase */
import {ParquetCompression} from './schema/declare';
import * as Util from './util';
import zlib from 'zlib';
import snappyjs from 'snappyjs';

let brotli: any;
let lzo: any;
let lz4js: any;

export interface ParquetCompressionKit {
  deflate: (value: Buffer) => Buffer;
  inflate: (value: Buffer, size: number) => Buffer;
}

export const PARQUET_COMPRESSION_METHODS: Record<ParquetCompression, ParquetCompressionKit> = {
  UNCOMPRESSED: {
    deflate: deflate_identity,
    inflate: inflate_identity
  },
  GZIP: {
    deflate: deflate_gzip,
    inflate: inflate_gzip
  },
  SNAPPY: {
    deflate: deflate_snappy,
    inflate: inflate_snappy
  },
  LZO: {
    deflate: deflate_lzo,
    inflate: inflate_lzo
  },
  BROTLI: {
    deflate: deflate_brotli,
    inflate: inflate_brotli
  },
  LZ4: {
    deflate: deflate_lz4,
    inflate: inflate_lz4
  }
};

/**
 * Deflate a value using compression method `method`
 */
export function deflate(method: ParquetCompression, value: Buffer): Buffer {
  if (!(method in PARQUET_COMPRESSION_METHODS)) {
    throw new Error(`invalid compression method: ${method}`);
  }

  return PARQUET_COMPRESSION_METHODS[method].deflate(value);
}

function deflate_identity(value: Buffer): Buffer {
  return value;
}

function deflate_gzip(value: Buffer): Buffer {
  return zlib.gzipSync(value);
}

function deflate_snappy(value: Buffer): Buffer {
  return snappyjs.compress(value);
}

function deflate_lzo(value: Buffer): Buffer {
  lzo = lzo || Util.load('lzo');
  return lzo.compress(value);
}

function deflate_brotli(value: Buffer): Buffer {
  brotli = brotli || Util.load('brotli');
  const result = brotli.compress(value, {
    mode: 0,
    quality: 8,
    lgwin: 22
  });
  return result ? Buffer.from(result) : Buffer.alloc(0);
}

function deflate_lz4(value: Buffer): Buffer {
  lz4js = lz4js || Util.load('lz4js');
  try {
    // let result = Buffer.alloc(lz4js.encodeBound(value.length));
    // const compressedSize = lz4.encodeBlock(value, result);
    // // remove unnecessary bytes
    // result = result.slice(0, compressedSize);
    // return result;
    return Buffer.from(lz4js.compress(value));
  } catch (err) {
    throw err;
  }
}

/**
 * Inflate a value using compression method `method`
 */
export function inflate(method: ParquetCompression, value: Buffer, size: number): Buffer {
  if (!(method in PARQUET_COMPRESSION_METHODS)) {
    throw new Error(`invalid compression method: ${method}`);
  }

  return PARQUET_COMPRESSION_METHODS[method].inflate(value, size);
}

function inflate_identity(value: Buffer): Buffer {
  return value;
}

function inflate_gzip(value: Buffer): Buffer {
  return zlib.gunzipSync(value);
}

function inflate_snappy(value: Buffer): Buffer {
  return snappyjs.uncompress(value);
}

function inflate_lzo(value: Buffer, size: number): Buffer {
  lzo = lzo || Util.load('lzo');
  return lzo.decompress(value, size);
}

function inflate_lz4(value: Buffer, size: number): Buffer {
  lz4js = lz4js || Util.load('lz4js');
  try {
    // let result = Buffer.alloc(size);
    // const uncompressedSize = lz4js.decodeBlock(value, result);
    // // remove unnecessary bytes
    // result = result.slice(0, uncompressedSize);
    // return result;
    return Buffer.from(lz4js.decompress(value, size));
  } catch (err) {
    throw err;
  }
}

function inflate_brotli(value: Buffer): Buffer {
  brotli = brotli || Util.load('brotli');
  if (!value.length) {
    return Buffer.alloc(0);
  }
  return Buffer.from(brotli.decompress(value));
}
