// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  createLAZChunkDecoderCursor,
  decodeLAZChunk,
  decodeLAZChunkTable,
  encodeLAZChunk,
  getLAZChunkDeclaredByteLength,
  getLAZChunkHeaderByteLength,
  NeedsMoreData
} from '@loaders.gl/loader-utils';

const FIXED_CHUNK_TABLE = new Uint8Array([107, 237, 189, 84, 131, 215, 0, 0, 0]);
const VARIABLE_CHUNK_TABLE = new Uint8Array([
  135, 203, 162, 167, 61, 207, 107, 137, 42, 49, 95, 213, 77, 13, 174, 157, 154, 98, 215, 60, 30,
  211, 89, 209, 0, 0, 0
]);

test('decodeLAZChunkTable decodes fixed-size chunk byte lengths', () => {
  const padded = new Uint8Array(FIXED_CHUNK_TABLE.byteLength + 4);
  padded.set(FIXED_CHUNK_TABLE, 2);

  expect(
    decodeLAZChunkTable(padded.subarray(2, 2 + FIXED_CHUNK_TABLE.byteLength), {
      chunkCount: 4,
      pointCount: 1024,
      chunkSize: 256,
      variable: false
    })
  ).toEqual([
    {pointCount: 256, byteLength: 7485},
    {pointCount: 256, byteLength: 7498},
    {pointCount: 256, byteLength: 7492},
    {pointCount: 256, byteLength: 7488}
  ]);
});

test('decodeLAZChunkTable decodes variable point counts and byte lengths', () => {
  expect(
    decodeLAZChunkTable(VARIABLE_CHUNK_TABLE, {
      chunkCount: 5,
      pointCount: 100000,
      chunkSize: 0xffffffff,
      variable: true
    })
  ).toEqual([
    {pointCount: 66272, byteLength: 358488},
    {pointCount: 12121, byteLength: 99533},
    {pointCount: 12347, byteLength: 96729},
    {pointCount: 4571, byteLength: 36988},
    {pointCount: 4689, byteLength: 37315}
  ]);
});

test('decodeLAZChunkTable rejects truncated arithmetic input', () => {
  expect(() =>
    decodeLAZChunkTable(VARIABLE_CHUNK_TABLE.subarray(0, -1), {
      chunkCount: 5,
      pointCount: 100000,
      chunkSize: 0xffffffff,
      variable: true
    })
  ).toThrowError(NeedsMoreData);
});

test('layered LAZ chunk framing is available before layer payloads', () => {
  const metadata = {
    pointDataRecordFormat: 7,
    pointDataRecordLength: 36,
    pointCount: 2,
    point14ItemVersion: 3 as const,
    rgb14ItemVersion: 3 as const,
    byte14ItemVersion: 3 as const
  };
  const rawPointData = new Uint8Array(metadata.pointDataRecordLength * metadata.pointCount);
  const dataView = new DataView(rawPointData.buffer);
  for (let pointIndex = 0; pointIndex < metadata.pointCount; pointIndex++) {
    const pointOffset = pointIndex * metadata.pointDataRecordLength;
    dataView.setInt32(pointOffset, pointIndex, true);
    dataView.setInt32(pointOffset + 4, pointIndex * 2, true);
    dataView.setInt32(pointOffset + 8, pointIndex * 3, true);
    dataView.setUint8(pointOffset + 14, 0x11);
    dataView.setFloat64(pointOffset + 22, pointIndex, true);
  }
  const compressed = encodeLAZChunk(rawPointData, metadata);
  const headerByteLength = getLAZChunkHeaderByteLength(metadata);
  const padded = new Uint8Array(headerByteLength + 8);
  padded.set(compressed.subarray(0, headerByteLength), 4);

  expect(getLAZChunkDeclaredByteLength(padded.subarray(4, 4 + headerByteLength), metadata)).toBe(
    compressed.byteLength
  );
  expect(() => getLAZChunkDeclaredByteLength(compressed.subarray(0, 8), metadata)).toThrowError(
    NeedsMoreData
  );
  expect(getLAZChunkHeaderByteLength({...metadata, pointDataRecordFormat: 3})).toBe(40);
  expect(() =>
    getLAZChunkDeclaredByteLength(compressed, {...metadata, pointDataRecordFormat: 3})
  ).toThrowError(/Legacy LAZ chunk byte length is not self-describing/);
});

test('legacy LAZ cursor preserves state across appended compressed input', () => {
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

/** Create deterministic legacy RGB records with enough entropy for progressive input tests. */
function createLegacyPDRF2PointData(pointCount: number): Uint8Array {
  const pointDataRecordLength = 26;
  const pointData = new Uint8Array(pointCount * pointDataRecordLength);
  const dataView = new DataView(pointData.buffer);
  let value = 0x12345678;

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const pointOffset = pointIndex * pointDataRecordLength;
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    dataView.setInt32(pointOffset, value | 0, true);
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    dataView.setInt32(pointOffset + 4, value | 0, true);
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    dataView.setInt32(pointOffset + 8, value | 0, true);
    dataView.setUint16(pointOffset + 12, value & 0xffff, true);
    dataView.setUint8(pointOffset + 14, 0x11);
    dataView.setUint8(pointOffset + 15, pointIndex & 0x1f);
    dataView.setInt8(pointOffset + 16, pointIndex & 0x7f);
    dataView.setUint8(pointOffset + 17, (value >>> 16) & 0xff);
    dataView.setUint16(pointOffset + 18, pointIndex & 0xffff, true);
    dataView.setUint16(pointOffset + 20, value & 0xffff, true);
    dataView.setUint16(pointOffset + 22, (value >>> 8) & 0xffff, true);
    dataView.setUint16(pointOffset + 24, (value >>> 16) & 0xffff, true);
  }
  return pointData;
}
