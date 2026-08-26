// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  decompressBatchesWithNativeDecompressionStream,
  decompressWithNativeDecompressionStream
} from '@loaders.gl/compression/native-decompression';
import {concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';
import {compareArrayBuffers} from './utils/test-utils';
import {
  installRecordingDecompressionStream,
  NATIVE_DECOMPRESSION_FIXTURES,
  NATIVE_DECOMPRESSION_TEST_DATA,
  supportsNativeDecompressionStream,
  type NativeDecompressionTestFormat
} from './utils/native-decompression-test-utils';

type MutableGlobalThis = typeof globalThis & {
  Buffer?: typeof Buffer;
};

test('native decompression#real DecompressionStream formats in Node.js', async () => {
  for (const format of Object.keys(
    NATIVE_DECOMPRESSION_FIXTURES
  ) as NativeDecompressionTestFormat[]) {
    if (!(await supportsNativeDecompressionStream(format))) {
      console.log(`${format} DecompressionStream is not available in this runtime`);
      continue;
    }

    const nativeFormats: NativeDecompressionTestFormat[] = [];
    const restoreDecompressionStream = installRecordingDecompressionStream(nativeFormats);

    try {
      const compressedData = new Uint8Array(NATIVE_DECOMPRESSION_FIXTURES[format]).buffer;

      const decompressedData = await decompressWithNativeDecompressionStream(
        compressedData,
        format
      );
      expect(
        decompressedData && compareArrayBuffers(NATIVE_DECOMPRESSION_TEST_DATA, decompressedData)
      ).toBeTruthy();

      const splitIndex = Math.max(1, Math.floor(compressedData.byteLength / 2));
      const compressedBatches = [
        compressedData.slice(0, splitIndex),
        compressedData.slice(splitIndex, compressedData.byteLength)
      ];
      const decompressedBatches = decompressBatchesWithNativeDecompressionStream(
        compressedBatches,
        format
      );
      expect(decompressedBatches).toBeTruthy();
      const decompressedBatchData = await concatenateArrayBuffersAsync(decompressedBatches);
      expect(compareArrayBuffers(NATIVE_DECOMPRESSION_TEST_DATA, decompressedBatchData)).toBe(true);
      expect(nativeFormats).toEqual([format, format]);
    } finally {
      restoreDecompressionStream();
    }
  }
});

test('native decompression#returns null without global Buffer in Node.js', async () => {
  const compressedData = new Uint8Array(NATIVE_DECOMPRESSION_FIXTURES.gzip).buffer;
  const mutableGlobalThis = globalThis as MutableGlobalThis;
  const originalBuffer = mutableGlobalThis.Buffer;
  mutableGlobalThis.Buffer = undefined;

  try {
    const decompressedData = await decompressWithNativeDecompressionStream(compressedData, 'gzip');
    expect(decompressedData).toBe(null);
  } finally {
    mutableGlobalThis.Buffer = originalBuffer;
  }
});
