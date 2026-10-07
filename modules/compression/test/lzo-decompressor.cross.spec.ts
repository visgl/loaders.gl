import {expect, test} from 'vitest';
import {LzoDecompressor} from '../src/lzo-decompressor';
import {loadLzoWasm} from '../src/lib/compress-utils/lzo/wasm';

test('LZO WASM initializes and supports synchronous decoding in Node and Chromium', async () => {
  const decode = await loadLzoWasm();
  expect(
    new TextDecoder().decode(decode(new Uint8Array([22, 104, 101, 108, 108, 111, 17, 0, 0]), 5))
  ).toBe('hello');
  const decoder = new LzoDecompressor();
  await decoder.preload();
  expect(
    new TextDecoder().decode(
      decoder.decompressSync(new Uint8Array([22, 104, 101, 108, 108, 111, 17, 0, 0]).buffer, 5)
    )
  ).toBe('hello');
});
