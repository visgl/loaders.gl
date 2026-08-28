// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {BrotliCompression} from '@loaders.gl/compression/brotli-compression';
import {BrotliDecode} from '@loaders.gl/compression/brotli-decode';
import {DeflateCompression} from '@loaders.gl/compression/deflate-compression';
import {GZipCompression} from '@loaders.gl/compression/gzip-compression';
import {LZ4Compression} from '@loaders.gl/compression/lz4-compression';
import {SnappyHysnappyDecompressor} from '@loaders.gl/compression/snappy-decompressor-hysnappy';
import {SnappyJSCompressor} from '@loaders.gl/compression/snappy-compressor-snappyjs';
import {
  NATIVE_DECOMPRESSION_FIXTURES,
  NATIVE_DECOMPRESSION_TEST_DATA
} from './utils/native-decompression-test-utils';

test('BrotliCompression uses the optional injected fallback decoder', async () => {
  const compression = new BrotliCompression({
    modules: {
      brotli: {
        compress: () => {
          throw new Error('compression is not used by this test');
        },
        decompress: (input: Uint8Array) => BrotliDecode(input, undefined)
      }
    }
  });

  const output = await compression.decompress(
    new Uint8Array(NATIVE_DECOMPRESSION_FIXTURES.brotli).buffer
  );
  expect(new Uint8Array(output)).toEqual(new Uint8Array(NATIVE_DECOMPRESSION_TEST_DATA));
});

test('BrotliCompression exercises injected synchronous codec capabilities', async () => {
  const calls: Array<{operation: string; options: unknown}> = [];
  const restoreBrotli = replaceRegisteredModule('brotli', {
    compress: (input: Uint8Array, options: unknown) => {
      calls.push({operation: 'compress', options});
      return input.slice().reverse();
    },
    decompress: (input: Uint8Array, options: unknown) => {
      calls.push({operation: 'decompress', options});
      return input.slice().reverse();
    }
  });
  try {
    const compression = new BrotliCompression({brotli: {quality: 4, mode: 1}});
    const input = new Uint8Array([1, 2, 3, 4]);
    const compressed = compression.compressSync(input.buffer);
    expect(Array.from(new Uint8Array(compressed))).toEqual([4, 3, 2, 1]);
    expect(Array.from(new Uint8Array(compression.decompressSync(compressed)))).toEqual([
      1, 2, 3, 4
    ]);
    expect(calls).toEqual([
      {operation: 'compress', options: {mode: 1, quality: 4, lgwin: 22}},
      {operation: 'decompress', options: {mode: 1, quality: 4, lgwin: 22}}
    ]);
  } finally {
    restoreBrotli();
  }
});

test('BrotliCompression reports unavailable or failed synchronous codecs', () => {
  const restoreBrotli = replaceRegisteredModule('brotli', undefined);
  try {
    expect(() => new BrotliCompression().decompressSync(new ArrayBuffer(0))).toThrow(
      'synchronous fallback is unavailable'
    );
    replaceRegisteredModule('brotli', {compress: () => null, decompress: () => null});
    expect(() => new BrotliCompression().compressSync(new ArrayBuffer(0))).toThrow(
      'Brotli compression failed'
    );
  } finally {
    restoreBrotli();
  }
});

test('BrotliCompression fallback batches concatenate input before codec calls', async () => {
  const restoreBrotli = replaceRegisteredModule('brotli', {
    compress: (input: Uint8Array) => input,
    decompress: (input: Uint8Array) => input
  });
  try {
    const compression = new BrotliCompression();
    const inputBatches = [new Uint8Array([1, 2]).buffer, new Uint8Array([3, 4]).buffer];
    const compressed = await concatenateBatches(compression.compressBatches(inputBatches));
    expect(Array.from(new Uint8Array(compressed))).toEqual([1, 2, 3, 4]);
    const decompressed = await concatenateBatches(compression.decompressBatches(inputBatches));
    expect(Array.from(new Uint8Array(decompressed))).toEqual([1, 2, 3, 4]);
  } finally {
    restoreBrotli();
  }
});

test('DeflateCompression streaming fallback emits zlib-wrapped DEFLATE', async () => {
  const compression = new DeflateCompression({deflate: {useNative: false}});
  const input = new TextEncoder().encode('zlib-wrapped streaming fallback'.repeat(8));
  const compressed = await concatenateBatches(
    compression.compressBatches([input.slice(0, 20).buffer, input.slice(20).buffer])
  );
  const output = compression.decompressSync(compressed);
  expect(new Uint8Array(output)).toEqual(input);
});

test('GZipCompression preserves nested native selection options', () => {
  const compression = new GZipCompression({gzip: {useNative: false}});
  expect(compression.options.deflate?.useNative).toBe(false);
});

test('LZ4Compression decodes a raw block without loading lz4js', () => {
  const restoreLz4 = replaceRegisteredModule('lz4js', undefined);
  try {
    const output = new LZ4Compression().decompressSync(new Uint8Array([0x30, 1, 2, 3]).buffer, 3);
    expect(new Uint8Array(output)).toEqual(new Uint8Array([1, 2, 3]));
  } finally {
    restoreLz4();
  }
});

test('SnappyHysnappyDecompressor decodes Snappy with known and embedded output lengths', async () => {
  const input = new TextEncoder().encode('small independently compressed parquet page '.repeat(64));
  const compressor = new SnappyJSCompressor();
  await compressor.preload();
  const compressed = compressor.compressSync(input.buffer);
  const decompressor = new SnappyHysnappyDecompressor();
  await decompressor.preload();

  expect(new Uint8Array(decompressor.decompressSync(compressed, input.byteLength))).toEqual(input);
  expect(new Uint8Array(decompressor.decompressSync(compressed))).toEqual(input);
});

test('SnappyHysnappyDecompressor requires preload before synchronous decoding', () => {
  const decompressor = new SnappyHysnappyDecompressor();
  expect(() => decompressor.decompressSync(new Uint8Array([0]).buffer)).toThrow(
    'snappy hysnappy decoder has not been preloaded'
  );
});

/** Concatenates asynchronous output batches. */
async function concatenateBatches(batches: AsyncIterable<ArrayBuffer>): Promise<ArrayBuffer> {
  const outputs: Uint8Array[] = [];
  let byteLength = 0;
  for await (const batch of batches) {
    const output = new Uint8Array(batch);
    outputs.push(output);
    byteLength += output.byteLength;
  }
  const result = new Uint8Array(byteLength);
  let byteOffset = 0;
  for (const output of outputs) {
    result.set(output, byteOffset);
    byteOffset += output.byteLength;
  }
  return result.buffer;
}

/** Replaces one injectable module and returns a restorer. */
function replaceRegisteredModule(moduleName: string, module: unknown): () => void {
  const globalWithLoaders = globalThis as any;
  globalWithLoaders.loaders ||= {};
  globalWithLoaders.loaders.modules ||= {};
  const registeredModules = globalWithLoaders.loaders.modules;
  const hadModule = Object.prototype.hasOwnProperty.call(registeredModules, moduleName);
  const originalModule = registeredModules[moduleName];
  if (module === undefined) delete registeredModules[moduleName];
  else registeredModules[moduleName] = module;
  return () => {
    if (hadModule) registeredModules[moduleName] = originalModule;
    else delete registeredModules[moduleName];
  };
}
