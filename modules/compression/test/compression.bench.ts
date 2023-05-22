import {isBrowser} from '@loaders.gl/loader-utils';
import {
  Compression,
  NoCompression,
  GZipCompression,
  // DeflateCompression,
  LZ4Compression,
  ZstdCompression,
  SnappyCompression,
  BrotliCompression,
  BrotliCompressionZlib,
  // LZOCompression,
  // CompressionWorker,
  _GZipCompressionFflate,
  _DeflateCompressionFflate,
  _GZipCompressionPako,
  _DeflateCompressionPako,
  _GZipCompressionZlib,
  _DeflateCompressionZlib,
} from '@loaders.gl/compression';
import {getData} from './utils/test-utils';

// import * as brotli from 'brotli-compress'; 
// import brotliPromise, {BrotliWasmType} from 'brotli-wasm'; // Import the default export
// let brotli: BrotliWasmType | undefined;

import brotliDecompress from 'brotli/decompress'; // brotli has problems with compress in browsers
import lz4js from 'lz4js';
import {ZstdCodec} from 'zstd-codec';
// import lzo from 'lzo';

// Inject large dependencies through Compression constructor options
Object.assign(Compression.modules, {
  lz4js,
  // lzo,
  'zstd-codec': ZstdCodec,
  // brotli module has big problems with compress in browsers
  brotli: {
    decompress: brotliDecompress,
    compress: () => {
      throw new Error('brotli compress');
    }
  }
});

// const noCompression = new NoCompression();
// const gzipFflate = new GZipCompression();
// const gzipPako = new _GZipCompressionPako();
// const gzipZlib = new _GZipCompressionZlib();
// const brotli = new BrotliCompression();
// const brotliZlib = new BrotliCompressionZlib();
// const snappy = new SnappyCompression();
// const lz4 = new LZ4Compression();
// const zstd = new ZstdCompression();


export default async function compressionBench(bench) {
  const {binaryData} = getData();
  const gzippedData = new GZipCompression().compressSync(binaryData);
  const snappyData = new SnappyCompression().compressSync(binaryData)
  let brotliData: ArrayBuffer | undefined;
  try {
    brotliData = new BrotliCompressionZlib().compressSync(binaryData);
  } catch {
    // ignore errors
  }

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
      () => new _GZipCompressionZlib().compressSync(gzippedData)
    );
  }

  bench = bench.add(
    'GZip - decompress - Fflate - sync',
    {multiplier: binaryData.byteLength, unit: 'bytes'},
    () => new _GZipCompressionFflate().compressSync(gzippedData)
  );

  bench = bench.add(
    'GZip - decompress - Pako - sync',
    {multiplier: binaryData.byteLength, unit: 'bytes'},
    () => new _GZipCompressionPako().compressSync(gzippedData)
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
      () => new _GZipCompressionZlib().compressSync(binaryData)
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
  //   () => new _GZipCompressionZlib().compress(binaryData)
  // );
  
  return bench;
}
