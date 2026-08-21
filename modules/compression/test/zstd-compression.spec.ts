// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {ZstdCodec} from 'zstd-codec';
import {ZstdCompression} from '@loaders.gl/compression/zstd-compression';

test('ZstdCompression decompresses without an injected codec', async () => {
  const input = new TextEncoder().encode('A lightweight browser-native ZSTD fallback');
  const compressed = await compressWithZstdCodec(input);
  const originalModules = globalThis.loaders?.modules;
  if (globalThis.loaders) {
    globalThis.loaders.modules = {};
  }

  try {
    const output = await new ZstdCompression().decompress(compressed.buffer as ArrayBuffer);
    expect(new Uint8Array(output)).toEqual(input);
  } finally {
    if (globalThis.loaders) {
      globalThis.loaders.modules = originalModules;
    }
  }
});

/** Compresses a test vector without registering the optional codec with loaders.gl. */
async function compressWithZstdCodec(input: Uint8Array): Promise<Uint8Array> {
  return await new Promise(resolve => {
    ZstdCodec.run(codec => {
      const simpleCodec = new codec.Simple();
      resolve(simpleCodec.compress(input));
    });
  });
}
