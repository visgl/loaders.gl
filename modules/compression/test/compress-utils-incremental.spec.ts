// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {LZ4Compressor, LZ4Decompressor, LzoDecompressor} from '@loaders.gl/compression';
import {LZ4CompressUtilsDecompressor} from '../src/lz4-decompressor-compress-utils';

const RAW_LZ4_HELLO = Uint8Array.from([0x50, 104, 101, 108, 108, 111]);
const RAW_LZO_HELLO = Uint8Array.from([22, 104, 101, 108, 108, 111, 17, 0, 0]);

/** Public root and direct entrypoints must expose the same incremental raw contract. */
const RAW_DECODERS = [
  ['root raw LZ4', () => new LZ4Decompressor({raw: true}), RAW_LZ4_HELLO],
  ['direct raw LZ4', () => new LZ4CompressUtilsDecompressor({raw: true}), RAW_LZ4_HELLO],
  ['LZO', () => new LzoDecompressor(), RAW_LZO_HELLO]
] as const;

test.each(
  RAW_DECODERS
)('%s emits decoded bytes before requesting the rest of the block', async (_name, createDecoder, compressed) => {
  let requestedRemainder = false;
  let closed = false;
  /** Splits inside literals so collecting all input before yielding cannot pass. */
  async function* input() {
    try {
      yield compressed.slice(0, 3).buffer;
      requestedRemainder = true;
      yield compressed.slice(3).buffer;
    } finally {
      closed = true;
    }
  }
  const iterator = createDecoder().decompressBatches(input())[Symbol.asyncIterator]();
  try {
    const first = await iterator.next();
    expect(first.done).toBe(false);
    expect(new TextDecoder().decode(first.value)).toBe('he');
    expect(requestedRemainder).toBe(false);
    const chunks = [new Uint8Array(first.value)];
    for (;;) {
      const next = await iterator.next();
      if (next.done) break;
      chunks.push(new Uint8Array(next.value));
    }
    expect(new TextDecoder().decode(Uint8Array.from(chunks.flatMap(chunk => [...chunk])))).toBe(
      'hello'
    );
    expect(closed).toBe(true);
  } finally {
    await iterator.return?.();
  }
});

test.each([
  ['raw LZ4', () => new LZ4Decompressor({raw: true, maxOutputByteLength: 4}), RAW_LZ4_HELLO],
  ['LZO', () => new LzoDecompressor({maxOutputByteLength: 4}), RAW_LZO_HELLO]
] as const)('%s limits cumulative incremental output', async (_name, createDecoder, compressed) => {
  const iterator = createDecoder()
    .decompressBatches([compressed.slice(0, 3).buffer, compressed.slice(3).buffer])
    [Symbol.asyncIterator]();
  expect(new TextDecoder().decode((await iterator.next()).value)).toBe('he');
  await expect(iterator.next()).rejects.toThrow(/maxOutputByteLength/);
});

test.each(
  RAW_DECODERS
)('%s validates a truncated block when input finishes', async (_name, createDecoder, compressed) => {
  const iterator = createDecoder()
    .decompressBatches([compressed.slice(0, 3).buffer])
    [Symbol.asyncIterator]();
  expect(new TextDecoder().decode((await iterator.next()).value)).toBe('he');
  await expect(iterator.next()).rejects.toThrow();
});

test('Root LZ4 batch decoding preserves fragmented framed payloads', async () => {
  const expected = new TextEncoder().encode('framed LZ4 payload');
  const encoded = new Uint8Array(await new LZ4Compressor().compress(expected.buffer));
  const chunks: number[] = [];
  for await (const chunk of new LZ4Decompressor().decompressBatches([
    encoded.slice(0, 2).buffer,
    encoded.slice(2).buffer
  ]))
    chunks.push(...new Uint8Array(chunk));
  expect(Uint8Array.from(chunks)).toEqual(expected);
});

test('LZO optional atomic capacity still enforces the actual output limit', async () => {
  const decoder = new LzoDecompressor({maxOutputByteLength: 4});
  await decoder.preload();
  expect(() => decoder.decompressSync(RAW_LZO_HELLO.buffer)).toThrow(/maxOutputByteLength/);
  await expect(decoder.decompress(RAW_LZO_HELLO.buffer)).rejects.toThrow(/maxOutputByteLength/);
});
