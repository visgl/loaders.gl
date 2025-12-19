// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Bench} from '@probe.gl/bench';
import {isBrowser, registerJSModules} from '@loaders.gl/loader-utils';
import {
  GZipCompression,
  GZipCompressionZlib,
  SnappyCompression,
  BrotliCompression,
  BrotliCompressionZlib,
  _GZipCompressionFflate,
  _GZipCompressionPako
} from '@loaders.gl/compression';
import {getData} from './utils/test-utils';

import brotliDecompress from 'brotli/decompress'; // brotli has problems with compress in browsers
import lz4js from 'lz4js';
import {ZstdCodec} from 'zstd-codec';
registerJSModules({
  brotli: {
    decompress: brotliDecompress,
    compress: () => {
      throw new Error('brotli compress');
    }
  },
  lz4js,
  'zstd-codec': ZstdCodec
});

// Prepare data
const {binaryData} = getData();
const gzippedData = new GZipCompression().compressSync(binaryData);
const snappyData = new SnappyCompression().compressSync(binaryData);
let brotliData: ArrayBuffer | undefined;
try {
  brotliData = new BrotliCompressionZlib().compressSync(binaryData);
} catch {
  // ignore errors
}

// const noCompression = new NoCompression();
// const gzipFflate = new GZipCompression();
// const gzipPako = new _GZipCompressionPako();
// const gzipZlib = new GZipCompressionZlib();
// const brotli = new BrotliCompression();
// const brotliZlib = new BrotliCompressionZlib();
// const snappy = new SnappyCompression();
// const lz4 = new LZ4Compression();
// const zstd = new ZstdCompression();

export async function compressionBench(bench: Bench): Promise<Bench> {
  await compressionBenchDecompression(bench);

  await compressionBenchCompression(bench);

  // bench = bench.addAsync(
  //   'GZip - compress - Pako - async',
  //   {multiplier: binaryData.byteLength, unit: 'bytes'},
  //   () => {
  //     new _GZipCompressionPako().compress(binaryData);
  //   }
  // );
  // bench = bench.addAsync(
  //   'GZip - compress - Fflate - async',
  //   {multiplier: binaryData.byteLength, unit: 'bytes'},
  //   () => new _GZipCompressionFflate().compress(binaryData)
  // );
  // bench = bench.addAsync(
  //   'GZip - compress - Zlib - async',
  //   {multiplier: binaryData.byteLength, unit: 'bytes'},
  //   () => new GZipCompressionZlib().compress(binaryData)
  // );

  return bench;
}

export default compressionBench;

async function compressionBenchDecompression(bench: Bench): Promise<void> {
  bench = bench.group('Decompression');

  bench = bench.add(
    'Snappy - decompress - sync',
    {multiplier: binaryData.byteLength, unit: 'bytes'},
    () => new SnappyCompression().decompressSync(snappyData)
  );

  if (!isBrowser) {
    bench = bench.add(
      'GZip - decompress - Zlib - sync',
      {multiplier: binaryData.byteLength, unit: 'bytes'},
      () => new GZipCompressionZlib().decompressSync(gzippedData)
    );
  }

  bench = bench.add(
    'GZip - decompress - Fflate - sync',
    {multiplier: binaryData.byteLength, unit: 'bytes'},
    () => new _GZipCompressionFflate().decompressSync(gzippedData)
  );

  bench = bench.add(
    'GZip - decompress - Pako - sync',
    {multiplier: binaryData.byteLength, unit: 'bytes'},
    () => new _GZipCompressionPako().decompressSync(gzippedData)
  );

  if (brotliData) {
    const data = brotliData;
    bench = bench.add(
      'Brotli - decompress - Zlib - sync',
      {multiplier: binaryData.byteLength, unit: 'bytes'},
      () => new BrotliCompressionZlib().decompressSync(data)
    );
    bench = bench.add(
      'Brotli - decompress - sync',
      {multiplier: binaryData.byteLength, unit: 'bytes'},
      () => new BrotliCompression().decompressSync(data)
    );
  }
}

async function compressionBenchCompression(bench: Bench): Promise<void> {
  bench = bench.group('Compression');

  bench = bench.addAsync(
    'Snappy - compress - sync',
    {multiplier: binaryData.byteLength, unit: 'bytes'},
    () => new SnappyCompression().compressSync(binaryData)
  );

  if (!isBrowser) {
    bench = bench.add(
      'GZip - compress 6 - Zlib - sync',
      {multiplier: binaryData.byteLength, unit: 'bytes'},
      () => new GZipCompressionZlib().compressSync(binaryData)
    );
  }
  bench = bench.add(
    'GZip - compress 6 - Fflate - sync',
    {multiplier: binaryData.byteLength, unit: 'bytes'},
    () => new _GZipCompressionFflate().compressSync(binaryData)
  );
  bench = bench.add(
    'GZip - compress 6 - Pako - sync',
    {multiplier: binaryData.byteLength, unit: 'bytes'},
    () => new _GZipCompressionPako().compressSync(binaryData)
  );

  if (!isBrowser) {
    bench = bench.addAsync(
      'Brotli - compress 6 - Zlib - sync',
      {multiplier: binaryData.byteLength, unit: 'bytes'},
      () => new BrotliCompressionZlib().compressSync(binaryData)
    );
  }

  if (brotliData && new BrotliCompression().isCompressionSupported) {
    bench = bench.addAsync(
      'Brotli - compress 6 - sync',
      {multiplier: binaryData.byteLength, unit: 'bytes'},
      () => new BrotliCompression().compressSync(binaryData)
    );
  }
}
