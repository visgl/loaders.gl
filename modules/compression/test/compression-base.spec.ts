// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {Compression, Compressor, Decompressor} from '../src/lib/compression';

/** Minimal compressor used to exercise the shared compression base class. */
class TestCompressor extends Compressor {
  readonly name = 'test compressor';
  readonly extensions = ['test'];
  readonly contentEncodings = ['test'];
  readonly isSupported = true;

  /** Returns the input unchanged as the test compression operation. */
  compressSync(input: ArrayBuffer): ArrayBuffer {
    return input;
  }
}

/** Minimal decompressor used to exercise the shared decompression base class. */
class TestDecompressor extends Decompressor {
  readonly name = 'test decompressor';
  readonly extensions = ['test'];
  readonly contentEncodings = ['test'];
  readonly isSupported = true;

  /** Returns the input unchanged as the test decompression operation. */
  decompressSync(input: ArrayBuffer): ArrayBuffer {
    return input;
  }
}

/** Minimal combined transform used to exercise compatibility batch methods. */
class TestCompression extends Compression {
  readonly name = 'test compression';
  readonly extensions = ['test'];
  readonly contentEncodings = ['test'];
  readonly isSupported = true;

  /** Returns the input unchanged as the test compression operation. */
  compressSync(input: ArrayBuffer): ArrayBuffer {
    return input;
  }

  /** Returns the input unchanged as the test decompression operation. */
  decompressSync(input: ArrayBuffer): ArrayBuffer {
    return input;
  }
}

test('shared compressor and decompressor support async and batch APIs', async () => {
  const input = new Uint8Array([1, 2, 3]).buffer;
  const compressor = new TestCompressor();
  const decompressor = new TestDecompressor();

  expect(new Uint8Array(await compressor.compress(input))).toEqual(new Uint8Array([1, 2, 3]));
  expect(new Uint8Array(await decompressor.decompress(input))).toEqual(new Uint8Array([1, 2, 3]));

  const compressedBatches: ArrayBuffer[] = [];
  for await (const batch of compressor.compressBatches([input.slice(0, 1), input.slice(1)])) {
    compressedBatches.push(batch);
  }
  expect(new Uint8Array(compressedBatches[0])).toEqual(new Uint8Array([1, 2, 3]));

  const decompressedBatches: ArrayBuffer[] = [];
  for await (const batch of decompressor.decompressBatches([input.slice(0, 2), input.slice(2)])) {
    decompressedBatches.push(batch);
  }
  expect(new Uint8Array(decompressedBatches[0])).toEqual(new Uint8Array([1, 2, 3]));
});

test('combined compatibility transform supports both operations', async () => {
  const input = new Uint8Array([4, 5]).buffer;
  const compression = new TestCompression();

  expect(new Uint8Array(await compression.compress(input))).toEqual(new Uint8Array([4, 5]));
  expect(new Uint8Array(await compression.decompress(input))).toEqual(new Uint8Array([4, 5]));
});

test('base classes reject unsupported synchronous operations', () => {
  const compressor = new TestCompressor();
  const decompressor = new TestDecompressor();
  const input = new ArrayBuffer(0);

  expect(() => Compressor.prototype.compressSync.call(compressor, input)).toThrow(
    'test compressor: sync compression not supported'
  );
  expect(() => Decompressor.prototype.decompressSync.call(decompressor, input)).toThrow(
    'test decompressor: sync decompression not supported'
  );
  expect(() => Compression.prototype.decompressSync.call(compressor, input)).toThrow(
    'test compressor: sync decompression not supported'
  );
});
