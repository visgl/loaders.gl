// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Compressor, Decompressor} from '../src/lib/compression';
import {LazyCompressor, LazyDecompressor} from '../src/lib/lazy-compression';

const METADATA = {name: 'echo', extensions: ['echo'], contentEncodings: ['echo']};

class EchoCompressor extends Compressor {
  readonly name = 'echo compressor';
  readonly extensions = ['echo'];
  readonly contentEncodings = ['echo'];
  readonly isSupported = true;

  /** Returns the input unchanged. */
  compressSync(input: ArrayBuffer): ArrayBuffer {
    return input;
  }
}

class EchoDecompressor extends Decompressor {
  readonly name = 'echo decompressor';
  readonly extensions = ['echo'];
  readonly contentEncodings = ['echo'];
  readonly isSupported = true;

  /** Returns the input unchanged. */
  decompressSync(input: ArrayBuffer): ArrayBuffer {
    return input;
  }
}

test('LazyCompressor selects and caches a fallback implementation', async () => {
  let loadCount = 0;
  const compressor = new LazyCompressor(
    METADATA,
    async () => {
      loadCount++;
      return EchoCompressor;
    },
    {modules: {initial: true}},
    null
  );
  const input = new Uint8Array([1, 2, 3]).buffer;

  await expect(compressor.compress(input)).resolves.toBe(input);
  expect(await compressor.preload({additional: true})).toBe(await compressor.preload());
  expect(loadCount).toBe(1);
  const batches = [];
  for await (const batch of compressor.compressBatches([input])) batches.push(batch);
  expect(batches).toEqual([input]);
});

test('LazyCompressor requires preload for synchronous compression', () => {
  const compressor = new LazyCompressor(METADATA, async () => EchoCompressor, {}, null);
  expect(() => compressor.compressSync(new ArrayBuffer(0))).toThrow('call preload()');
});

test('LazyDecompressor selects a fallback and supports sync and batch APIs', async () => {
  let receivedOptions: Record<string, unknown> | undefined;
  class CapturingDecompressor extends EchoDecompressor {
    constructor(options: Record<string, unknown>) {
      super(options);
      receivedOptions = options;
    }
  }
  const decompressor = new LazyDecompressor(
    METADATA,
    async () => CapturingDecompressor,
    {modules: {initial: true}},
    null
  );
  const input = new Uint8Array([4, 5]).buffer;

  expect(() => decompressor.decompressSync(input)).toThrow('call preload()');
  await decompressor.preload({additional: true});
  expect(receivedOptions).toMatchObject({
    modules: {initial: true, additional: true},
    useNative: false
  });
  expect(await decompressor.decompress(input)).toBe(input);
  const batches = [];
  for await (const batch of decompressor.decompressBatches([input])) batches.push(batch);
  expect(batches).toEqual([input]);
});

test('LazyDecompressor resets failed implementation selection for retry', async () => {
  let attempt = 0;
  const decompressor = new LazyDecompressor(
    METADATA,
    async () => {
      attempt++;
      if (attempt === 1) throw new Error('temporary decoder failure');
      return EchoDecompressor;
    },
    {},
    null
  );

  await expect(decompressor.preload()).rejects.toThrow('temporary decoder failure');
  await expect(decompressor.preload()).resolves.toBeInstanceOf(EchoDecompressor);
  expect(attempt).toBe(2);
});
