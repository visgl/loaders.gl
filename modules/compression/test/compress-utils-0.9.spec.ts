// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {processOnWorker} from '@loaders.gl/worker-utils';
import {CompressionWorker, LzoDecompressor} from '@loaders.gl/compression';
import {DeflateCompressUtilsCompressor} from '../src/deflate-compressor-compress-utils';
import {DeflateCompressUtilsDecompressor} from '../src/deflate-decompressor-compress-utils';
import {LZ4CompressUtilsCompressor} from '../src/lz4-compressor-compress-utils';
import {LZ4CompressUtilsDecompressor} from '../src/lz4-decompressor-compress-utils';

const LZO_HELLO = new Uint8Array([22, 104, 101, 108, 108, 111, 17, 0, 0]).buffer;

test('LZO lazy decoder supports preload and sync with output capacity', async () => {
  const decoder = new LzoDecompressor();
  expect(() => decoder.decompressSync(LZO_HELLO, 10)).toThrow(/preload/);
  const [first, second] = await Promise.all([decoder.preload(), decoder.preload()]);
  expect(first).toBe(second);
  expect(new TextDecoder().decode(decoder.decompressSync(LZO_HELLO, 10))).toBe('hello');
  expect(await decoder.decompress(LZO_HELLO, 10)).toEqual(decoder.decompressSync(LZO_HELLO, 10));
  await expect(decoder.decompress(LZO_HELLO)).rejects.toThrow(/expectedSize/);
  await expect(decoder.decompress(LZO_HELLO, -1)).rejects.toThrow(/expectedSize/);
  await expect(decoder.decompress(LZO_HELLO, 4)).rejects.toThrow();
  await expect(decoder.decompress(LZO_HELLO, 512 * 1024 * 1024 + 1)).rejects.toThrow(
    /capacity limit/
  );
});

test.each([
  ['DEFLATE', DeflateCompressUtilsCompressor, DeflateCompressUtilsDecompressor],
  ['LZ4', LZ4CompressUtilsCompressor, LZ4CompressUtilsDecompressor]
])('%s raw bindings preserve sync/async interoperability and capacity', async (_name, Compressor, Decompressor) => {
  const bytes = new TextEncoder().encode('bounded raw payload '.repeat(8));
  const compressor = new Compressor({raw: true});
  const decompressor = new Decompressor({raw: true});
  expect(() => compressor.compressSync(bytes.buffer)).toThrow(/preload/);
  await Promise.all([compressor.preload(), decompressor.preload()]);
  const encoded = compressor.compressSync(bytes.buffer);
  expect(new Uint8Array(decompressor.decompressSync(encoded, bytes.byteLength))).toEqual(bytes);
  expect(
    new Uint8Array(
      await decompressor.decompress(await compressor.compress(bytes.buffer), bytes.byteLength)
    )
  ).toEqual(bytes);
});

test('LZO worker loads its decoder asset and forwards output capacity', async () => {
  const output = await processOnWorker(CompressionWorker, LZO_HELLO.slice(0), {
    compression: 'lzo',
    operation: 'decompress',
    expectedSize: 10,
    _workerType: 'test'
  });
  expect(new TextDecoder().decode(output)).toBe('hello');
  await expect(
    processOnWorker(CompressionWorker, LZO_HELLO.slice(0), {
      compression: 'lzo',
      operation: 'decompress',
      expectedSize: 10,
      maxOutputByteLength: 4,
      _workerType: 'test'
    })
  ).rejects.toThrow(/capacity limit/);
});
