// Forked from https://github.com/ironSource/parquetjs under MIT license

import zlib from 'zlib';
import snappy from 'snappyjs';
// import brotli from 'brotli';
import brotliDecompress from 'brotli/decompress';

export const PARQUET_COMPRESSION_METHODS = {
  UNCOMPRESSED: {
    deflate: deflateIdentity,
    inflate: inflateIdentity
  },
  GZIP: {
    deflate: deflateGzip,
    inflate: inflateGzip
  },
  SNAPPY: {
    deflate: deflateSnappy,
    inflate: inflateSnappy
  },
  LZO: {
    deflate: deflateLzo,
    inflate: inflateLzo
  },
  BROTLI: {
    deflate: deflateBrotli,
    inflate: inflateBrotli
  }
};

/**
 * Deflate a value using compression method `method`
 */
export function deflate(method, value) {
  if (!(method in PARQUET_COMPRESSION_METHODS)) {
    throw new Error(`parquet: invalid compression method ${method}`);
  }

  return PARQUET_COMPRESSION_METHODS[method].deflate(value);
}

/**
 * Inflate a value using compression method `method`
 */
export function inflate(method, value) {
  if (!(method in PARQUET_COMPRESSION_METHODS)) {
    throw new Error(`parquet: invalid compression method ${method}`);
  }

  return PARQUET_COMPRESSION_METHODS[method].inflate(value);
}

/**
 * Lazyily load lzo, avoids potential failing require
 * unless there was an attempt to access it
 */
function loadLZO() {
  return require('lzo');
}

function deflateIdentity(value) {
  return value;
}

function deflateGzip(value) {
  return zlib.gzipSync(value);
}

function deflateSnappy(value) {
  return snappy.compress(value);
}

function deflateLzo(value) {
  return loadLZO().compress(value);
}

function deflateBrotli(value) {
  throw new Error('brotli compression not supported');
  // TODO - works under Node.js
  // return new Buffer(brotli.compress(value, {
  //   mode: 0,
  //   quality: 8,
  //   lgwin: 22
  // }));
}

function inflateIdentity(value) {
  return value;
}

function inflateGzip(value) {
  return zlib.gunzipSync(value);
}

function inflateSnappy(value) {
  return snappy.uncompress(value);
}

function inflateLzo(value) {
  return loadLZO().decompress(value);
}

function inflateBrotli(value) {
  return new Buffer(brotliDecompress(value));
}
