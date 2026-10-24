// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {readORCPostScript} from '../../src/orc/lib/parsers/parse-orc';
import {
  decompressORCStream,
  preloadORCCompression
} from '../../src/orc/lib/parsers/orc-compression';

test('ORC LZO decodes framed compressed and original chunks with bounded capacity', async () => {
  await preloadORCCompression('LZO');
  const compressed = new Uint8Array([18, 0, 0, 22, 104, 101, 108, 108, 111, 17, 0, 0, 3, 0, 0, 33]);
  expect(new TextDecoder().decode(decompressORCStream(compressed, 'LZO', 16))).toBe('hello!');
  expect(() => decompressORCStream(compressed, 'LZO', 4)).toThrow();
  expect(() => decompressORCStream(compressed.subarray(0, 11), 'LZO', 16)).toThrow(/Truncated/);
});

test('ORC defaults omitted compression block size before decoding LZO', async () => {
  const postscript = readORCPostScript(
    Uint8Array.from([79, 82, 67, 18, 0, 0, 22, 104, 101, 108, 108, 111, 17, 0, 0, 8, 12, 16, 3, 4])
      .buffer
  );
  expect(postscript.compressionBlockSize).toBe(262_144);
  await preloadORCCompression(postscript.compression);
  const compressed = Uint8Array.from([18, 0, 0, 22, 104, 101, 108, 108, 111, 17, 0, 0]);
  expect(
    new TextDecoder().decode(
      decompressORCStream(compressed, postscript.compression, postscript.compressionBlockSize)
    )
  ).toBe('hello');
});
