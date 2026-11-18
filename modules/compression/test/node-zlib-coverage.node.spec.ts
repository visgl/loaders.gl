// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {brotliDecompressSync} from 'node:zlib';
import {concatenateArrayBuffers} from '@loaders.gl/core/loader-utils';
import {BrotliCompressor} from '../src/brotli-compressor';

const INPUT = new TextEncoder().encode('small deterministic compression payload').buffer;

test('Brotli WASM stream output interoperates with Node zlib', async () => {
  const compressor = new BrotliCompressor({useNative: false});
  expect(() => compressor.compressSync(INPUT)).toThrow('call preload');
  await compressor.preload();
  expect(compressor.compressSync(INPUT).byteLength).toBeGreaterThan(0);
  expect((await compressor.compress(INPUT)).byteLength).toBeGreaterThan(0);
  const batches = await collect(compressor.compressBatches([INPUT.slice(0, 4), INPUT.slice(4)]));
  expect(
    new Uint8Array(brotliDecompressSync(new Uint8Array(concatenateArrayBuffers(...batches))))
  ).toEqual(new Uint8Array(INPUT));
});

/** Collects an asynchronous byte stream for compact error and batching assertions. */
async function collect(iterable: AsyncIterable<ArrayBuffer>): Promise<ArrayBuffer[]> {
  const values: ArrayBuffer[] = [];
  for await (const value of iterable) values.push(value);
  return values;
}
