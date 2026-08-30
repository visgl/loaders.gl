// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {BrotliCompressor} from '../src/brotli-compressor';
import {DeflateCompression} from '../src/lib/deflate-compression';

const INPUT = new TextEncoder().encode('small deterministic compression payload').buffer;

test.each([false, true])('DeflateCompression uses Node zlib with gzip=%s', async gzip => {
  const compression = new DeflateCompression({
    deflate: {gzip, useNative: false, useZlib: true}
  });
  const compressed = await compression.compress(INPUT);
  expect(new Uint8Array(await compression.decompress(compressed))).toEqual(new Uint8Array(INPUT));

  const compressedSync = compression.compressSync(INPUT);
  expect(new Uint8Array(compression.decompressSync(compressedSync))).toEqual(new Uint8Array(INPUT));
});

test('DeflateCompression reports rejected and failed compatibility processors', async () => {
  const compression = new DeflateCompression({deflate: {useNative: false}});
  const rejectingProcessor = {push: () => false};
  await expect(collect(compression.transformBatches(rejectingProcessor, [INPUT]))).rejects.toThrow(
    'rejected a batch'
  );

  const finalRejectingProcessor = {
    push: (_data: Uint8Array, final?: boolean) => !final
  };
  await expect(collect(compression.transformBatches(finalRejectingProcessor, []))).rejects.toThrow(
    'rejected the final batch'
  );

  const failingProcessor = {
    onEnd: undefined as ((status: number) => void) | undefined,
    push() {
      this.onEnd?.(1);
      return true;
    }
  };
  await expect(collect(compression.transformBatches(failingProcessor, [INPUT]))).rejects.toThrow(
    'failed with status 1'
  );
});

test('BrotliCompressor preloads and batches through Node zlib', async () => {
  const compressor = new BrotliCompressor({useNative: false, brotli: {useZlib: true}});
  expect(() => compressor.compressSync(INPUT)).toThrow('call preload');
  await compressor.preload();
  expect(compressor.compressSync(INPUT).byteLength).toBeGreaterThan(0);
  expect((await compressor.compress(INPUT)).byteLength).toBeGreaterThan(0);
  const batches = await collect(compressor.compressBatches([INPUT.slice(0, 4), INPUT.slice(4)]));
  expect(batches).toHaveLength(1);
  expect(batches[0].byteLength).toBeGreaterThan(0);
});

/** Collects an asynchronous byte stream for compact error and batching assertions. */
async function collect(iterable: AsyncIterable<ArrayBuffer>): Promise<ArrayBuffer[]> {
  const values: ArrayBuffer[] = [];
  for await (const value of iterable) values.push(value);
  return values;
}
