// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
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

test('native decompression#real DecompressionStream formats in Node.js', async t => {
  for (const format of Object.keys(
    NATIVE_DECOMPRESSION_FIXTURES
  ) as NativeDecompressionTestFormat[]) {
    if (!(await supportsNativeDecompressionStream(format))) {
      t.comment(`${format} DecompressionStream is not available in this runtime`);
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
      t.ok(
        decompressedData && compareArrayBuffers(NATIVE_DECOMPRESSION_TEST_DATA, decompressedData),
        `native atomic ${format} decompression works in Node.js`
      );

      const splitIndex = Math.max(1, Math.floor(compressedData.byteLength / 2));
      const compressedBatches = [
        compressedData.slice(0, splitIndex),
        compressedData.slice(splitIndex, compressedData.byteLength)
      ];
      const decompressedBatches = decompressBatchesWithNativeDecompressionStream(
        compressedBatches,
        format
      );
      t.ok(decompressedBatches, `native batched ${format} stream is created in Node.js`);
      const decompressedBatchData = await concatenateArrayBuffersAsync(decompressedBatches);
      t.ok(
        compareArrayBuffers(NATIVE_DECOMPRESSION_TEST_DATA, decompressedBatchData),
        `native batched ${format} decompression works in Node.js`
      );
      t.deepEqual(
        nativeFormats,
        [format, format],
        `${format} uses the native stream for atomic and batched Node.js decompression`
      );
    } finally {
      restoreDecompressionStream();
    }
  }

  t.end();
});

test('native decompression#returns null without global Buffer in Node.js', async t => {
  const compressedData = new Uint8Array(NATIVE_DECOMPRESSION_FIXTURES.gzip).buffer;
  const mutableGlobalThis = globalThis as MutableGlobalThis;
  const originalBuffer = mutableGlobalThis.Buffer;
  mutableGlobalThis.Buffer = undefined;

  try {
    const decompressedData = await decompressWithNativeDecompressionStream(compressedData, 'gzip');
    t.equal(decompressedData, null, 'native helper lets callers choose a fallback without Buffer');
  } finally {
    mutableGlobalThis.Buffer = originalBuffer;
  }

  t.end();
});
