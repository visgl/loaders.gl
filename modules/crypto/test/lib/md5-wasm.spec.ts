// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import md5WASM from '../../src/lib/algorithms/md5-wasm';

const textEncoder = new TextEncoder();

test('md5WASM#hash supports ArrayBuffer and Uint8Array inputs', async () => {
  const input = textEncoder.encode('array md5 input');
  const arrayBufferInput = input.buffer.slice(0);

  const hashFromTypedArray = await runMd5(input);
  const hashFromArrayBuffer = await runMd5(arrayBufferInput);

  expect(hashFromTypedArray, 'hash matches expected value').toBe('debde7239b0aafd48eccd2d048e80c3a');
  expect(hashFromArrayBuffer, 'ArrayBuffer input hashes match').toBe(hashFromTypedArray);
});

test('md5WASM#hash works when Buffer is undefined', async () => {
  const originalBuffer = globalThis.Buffer;
  // @ts-ignore Buffer is intentionally overridden for this test
  globalThis.Buffer = undefined;

  try {
    const input = textEncoder.encode('bufferless md5 input');
    const hash = await runMd5(input);

    expect(hash, 'hash generated without Buffer present').toBe('c2cccb15893fdb77c499a18ee750c51b');
  } finally {
    if (typeof originalBuffer === 'undefined') {
      delete globalThis.Buffer;
    } else {
      globalThis.Buffer = originalBuffer;
    }
  }
});

function runMd5(data: ArrayBuffer | Uint8Array): Promise<string> {
  return new Promise((resolve, reject) => {
    md5WASM(data).then(resolve).catch(reject);
  });
}
