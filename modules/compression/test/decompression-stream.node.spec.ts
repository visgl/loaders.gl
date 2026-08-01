// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {
  BrotliCompression,
  DeflateCompression,
  GZipCompression,
  ZstdCompression
} from '@loaders.gl/compression';
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

test('compression#native DecompressionStream formats in Node.js', async t => {
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
      const compression =
        format === 'gzip'
          ? new GZipCompression()
          : format === 'deflate'
            ? new DeflateCompression()
            : format === 'deflate-raw'
              ? new DeflateCompression({raw: true})
              : format === 'brotli'
                ? new BrotliCompression()
                : new ZstdCompression();
      const compressedData = new Uint8Array(NATIVE_DECOMPRESSION_FIXTURES[format]).buffer;

      const decompressedData = await compression.decompress(compressedData);
      t.ok(
        compareArrayBuffers(NATIVE_DECOMPRESSION_TEST_DATA, decompressedData),
        `native atomic ${format} decompression works in Node.js`
      );

      const splitIndex = Math.max(1, Math.floor(compressedData.byteLength / 2));
      const compressedBatches = [
        compressedData.slice(0, splitIndex),
        compressedData.slice(splitIndex, compressedData.byteLength)
      ];
      const decompressedBatches = compression.decompressBatches(compressedBatches);
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
