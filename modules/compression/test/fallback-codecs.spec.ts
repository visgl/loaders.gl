// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {BrotliDecode} from '@loaders.gl/compression/brotli-decode';
import {SnappyHysnappyDecompressor} from '@loaders.gl/compression/snappy-decompressor-hysnappy';
import {SnappyJSCompressor} from '@loaders.gl/compression/snappy-compressor-snappyjs';
import {
  NATIVE_DECOMPRESSION_FIXTURES,
  NATIVE_DECOMPRESSION_TEST_DATA
} from './utils/native-decompression-test-utils';

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

/** Concatenates asynchronous output batches. */
async function concatenateBatches(batches: AsyncIterable<ArrayBuffer>): Promise<ArrayBuffer> {
  const outputs: Uint8Array[] = [];
  let byteLength = 0;
  for await (const batch of batches) {
    const output = new Uint8Array(batch);
    outputs.push(output);
    byteLength += output.byteLength;
  }
  const result = new Uint8Array(byteLength);
  let byteOffset = 0;
  for (const output of outputs) {
    result.set(output, byteOffset);
    byteOffset += output.byteLength;
  }
  return result.buffer;
}

/** Replaces one injectable module and returns a restorer. */
function replaceRegisteredModule(moduleName: string, module: unknown): () => void {
  const globalWithLoaders = globalThis as any;
  globalWithLoaders.loaders ||= {};
  globalWithLoaders.loaders.modules ||= {};
  const registeredModules = globalWithLoaders.loaders.modules;
  const hadModule = Object.prototype.hasOwnProperty.call(registeredModules, moduleName);
  const originalModule = registeredModules[moduleName];
  if (module === undefined) delete registeredModules[moduleName];
  else registeredModules[moduleName] = module;
  return () => {
    if (hadModule) registeredModules[moduleName] = originalModule;
    else delete registeredModules[moduleName];
  };
}
