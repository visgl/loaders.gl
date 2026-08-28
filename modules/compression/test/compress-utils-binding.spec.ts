// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  CompressUtilsCompression,
  CompressUtilsCompressor,
  CompressUtilsDecompressor
} from '../src/lib/compress-utils-compression';

const METADATA = {name: 'fake', extensions: ['fake'], contentEncodings: ['fake']};
const INPUT = new Uint8Array([1, 2, 3]);

test('compress-utils direction-specific bindings copy atomic and streaming output', async () => {
  let destroyedStreams = 0;
  const createStream = async () => ({
    write: (input: Uint8Array) => input,
    finish: () => new Uint8Array([9]),
    destroy: () => {
      destroyedStreams++;
    }
  });
  const module = {
    compress: async (input: Uint8Array) => input,
    createCompressStream: createStream,
    decompress: async (input: Uint8Array) => input,
    createDecompressStream: createStream
  };
  const compressor = new CompressUtilsCompressor(METADATA, async () => module, {
    compressUtils: {level: 1}
  });
  const decompressor = new CompressUtilsDecompressor(METADATA, async () => module);

  const compressed = await compressor.compress(INPUT.buffer);
  expect(new Uint8Array(compressed)).toEqual(INPUT);
  const compressedBatches = await collect(compressor.compressBatches([INPUT.buffer]));
  expect(compressedBatches.map(batch => Array.from(new Uint8Array(batch)))).toEqual([
    [1, 2, 3],
    [9]
  ]);
  const decompressedBatches = await collect(decompressor.decompressBatches(compressedBatches));
  expect(decompressedBatches.map(batch => Array.from(new Uint8Array(batch)))).toEqual([
    [1, 2, 3],
    [9],
    [9]
  ]);
  expect(destroyedStreams).toBe(2);
});

test('compress-utils combined binding supports both atomic directions', async () => {
  const module = {
    compress: async (input: Uint8Array) => Uint8Array.from(input, value => value + 1),
    decompress: async (input: Uint8Array) => Uint8Array.from(input, value => value - 1),
    createCompressStream: async () => createPassthroughStream(),
    createDecompressStream: async () => createPassthroughStream()
  };
  const compression = new CompressUtilsCompression(
    METADATA,
    async () => module,
    async () => module,
    {compressUtils: {mode: 'test'}}
  );

  expect(new Uint8Array(await compression.compress(INPUT.buffer))).toEqual(
    new Uint8Array([2, 3, 4])
  );
  expect(new Uint8Array(await compression.decompress(INPUT.buffer))).toEqual(
    new Uint8Array([0, 1, 2])
  );
  expect(compression.options.compressUtils).toEqual({mode: 'test'});
});

test('compress-utils streaming transform destroys streams after failures', async () => {
  let destroyed = false;
  const module = {
    compress: async (input: Uint8Array) => input,
    createCompressStream: async () => ({
      write: () => {
        throw new Error('stream write failed');
      },
      finish: () => new Uint8Array(0),
      destroy: () => {
        destroyed = true;
      }
    })
  };
  const compressor = new CompressUtilsCompressor(METADATA, async () => module);

  await expect(collect(compressor.compressBatches([INPUT.buffer]))).rejects.toThrow(
    'stream write failed'
  );
  expect(destroyed).toBe(true);
});

/** Collects an async buffer sequence. */
async function collect(batches: AsyncIterable<ArrayBuffer>): Promise<ArrayBuffer[]> {
  const result: ArrayBuffer[] = [];
  for await (const batch of batches) result.push(batch);
  return result;
}

/** Creates a stream that emits each input and no final bytes. */
function createPassthroughStream() {
  return {
    write: (input: Uint8Array) => input,
    finish: () => new Uint8Array(0),
    destroy: () => {}
  };
}
