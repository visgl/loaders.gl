// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {SnappyHysnappyDecompressor} from '@loaders.gl/compression/snappy-decompressor-hysnappy';
import {SnappyJSCompressor} from '@loaders.gl/compression/snappy-compressor-snappyjs';
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
