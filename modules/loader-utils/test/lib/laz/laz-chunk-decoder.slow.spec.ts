// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  createLAZChunkDecoderCursor,
  decodeLAZChunk,
  encodeLAZChunk
} from '@loaders.gl/loader-utils';
import {createLegacyPDRF2PointData} from './laz-test-utils';

test('legacy LAZ cursor preserves state across byte-at-a-time high-entropy input', () => {
  const metadata = {
    pointDataRecordFormat: 2,
    pointDataRecordLength: 26,
    pointCount: 4096
  };
  const rawPointData = createLegacyPDRF2PointData(metadata.pointCount);
  const compressed = encodeLAZChunk(rawPointData, metadata);
  const expected = decodeLAZChunk(compressed, metadata);
  const cursor = createLAZChunkDecoderCursor(new Uint8Array(0), metadata);
  const actual = new Uint8Array(expected.byteLength);
  let decodedPointCount = 0;
  let firstOutputByteLength = 0;

  for (let byteOffset = 0; byteOffset < compressed.byteLength; byteOffset++) {
    const byteEnd = byteOffset + 1;
    cursor.feed(compressed.subarray(byteOffset, byteEnd));
    const decoded = cursor.decodeAvailableInto(
      actual,
      decodedPointCount * metadata.pointDataRecordLength,
      metadata.pointCount - decodedPointCount
    );
    decodedPointCount += decoded;
    if (decoded > 0 && firstOutputByteLength === 0) {
      firstOutputByteLength = byteEnd;
    }
    expect(cursor.remainingPointCount).toBe(metadata.pointCount - decodedPointCount);
  }

  decodedPointCount += cursor.decodeAvailableInto(
    actual,
    decodedPointCount * metadata.pointDataRecordLength,
    metadata.pointCount - decodedPointCount,
    true
  );
  expect(decodedPointCount).toBe(metadata.pointCount);
  expect(firstOutputByteLength).toBeGreaterThan(0);
  expect(firstOutputByteLength).toBeLessThan(compressed.byteLength);
  expect(actual).toEqual(expected);
});
