// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {GZipCompression} from '@loaders.gl/compression';
import {compareArrayBuffers} from './utils/test-utils';

type MutableGlobalThis = typeof globalThis & {
  Buffer?: typeof Buffer;
};

test('gzip#native DecompressionStream accepts ArrayBuffer input in Node.js', async t => {
  if (typeof globalThis.DecompressionStream === 'undefined') {
    t.comment('DecompressionStream is not available in this runtime');
    t.end();
    return;
  }

  try {
    const probeStream = new globalThis.DecompressionStream('gzip');
    await probeStream.writable.abort();
  } catch {
    t.comment('gzip DecompressionStream is not available in this runtime');
    t.end();
    return;
  }

  const inputData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]).buffer;
  const compression = new GZipCompression();
  const compressedData = compression.compressSync(inputData);
  const decompressedData = await compression.decompress(compressedData);

  t.ok(compareArrayBuffers(inputData, decompressedData), 'native gzip accepts ArrayBuffer input');
  t.end();
});

test('gzip#native DecompressionStream falls back without global Buffer in Node.js', async t => {
  const inputData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]).buffer;
  const compression = new GZipCompression();
  const compressedData = compression.compressSync(inputData);
  const mutableGlobalThis = globalThis as MutableGlobalThis;
  const originalBuffer = mutableGlobalThis.Buffer;
  mutableGlobalThis.Buffer = undefined;

  try {
    const decompressedData = await compression.decompress(compressedData);
    t.ok(compareArrayBuffers(inputData, decompressedData), 'gzip falls back without Buffer');
  } finally {
    mutableGlobalThis.Buffer = originalBuffer;
  }

  t.end();
});
