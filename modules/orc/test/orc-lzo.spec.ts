// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {decompressORCStream, preloadORCCompression} from '../src/lib/parsers/orc-compression';

test('ORC LZO decodes framed compressed and original chunks with bounded capacity', async () => {
  await preloadORCCompression('LZO');
  const compressed = new Uint8Array([18, 0, 0, 22, 104, 101, 108, 108, 111, 17, 0, 0, 3, 0, 0, 33]);
  expect(new TextDecoder().decode(decompressORCStream(compressed, 'LZO', 16))).toBe('hello!');
  expect(() => decompressORCStream(compressed, 'LZO', 4)).toThrow();
  expect(() => decompressORCStream(compressed.subarray(0, 11), 'LZO', 16)).toThrow(/Truncated/);
});
