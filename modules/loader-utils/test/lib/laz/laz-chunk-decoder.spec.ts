// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  createLAZChunkDecoder,
  createLAZChunkDecoderCursor,
  decodeLAZChunk,
  decodeLAZChunkInBatches,
  decodeLAZChunkTable,
  encodeLAZChunk,
  getLAZChunkByteLength,
  getLAZChunkDeclaredByteLength,
  getLAZChunkHeaderByteLength,
  NeedsMoreData
} from '@loaders.gl/loader-utils';
import {createLegacyPDRF2PointData} from './laz-test-utils';

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
    pointCount: 64
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

test('feedable layered decoder covers incremental lifecycle and batch exhaustion', () => {
  const {metadata, rawPointData, compressed} = createLayeredPDRF7Chunk();
  const decoder = createLAZChunkDecoder(metadata);
  expect(() => decoder.decode()).toThrowError(NeedsMoreData);

  const headerByteLength = getLAZChunkHeaderByteLength(metadata);
  decoder.feed(compressed.subarray(0, headerByteLength));
  expect(decoder.readBatch(1)).toBeNull();
  expect(() => getLAZChunkByteLength(compressed.subarray(0, headerByteLength), metadata)).toThrow(
    NeedsMoreData
  );

  decoder.feed(compressed.subarray(headerByteLength));
  expect(getLAZChunkByteLength(compressed, metadata)).toBe(compressed.byteLength);
  expect(decoder.readBatch(1)).toEqual(rawPointData.subarray(0, metadata.pointDataRecordLength));
  expect(decoder.remainingPointCount).toBe(1);
  expect(decoder.readBatch(10)).toEqual(rawPointData.subarray(metadata.pointDataRecordLength));
  expect(decoder.readBatch(1)).toBeNull();
  decoder.close();
  expect(() => decoder.feed(new Uint8Array())).toThrow('closed');
});

test('layered decoder streams fragmented chunks through the async batch helper', async () => {
  const {metadata, rawPointData, compressed} = createLayeredPDRF7Chunk();
  const chunks = [compressed.subarray(0, 10), compressed.subarray(10, 40), compressed.subarray(40)];
  const batches: Uint8Array[] = [];
  for await (const batch of decodeLAZChunkInBatches(chunks, metadata, {batchSize: 1})) {
    batches.push(batch);
  }
  expect(batches).toHaveLength(2);
  expect(new Uint8Array([...batches[0], ...batches[1]])).toEqual(rawPointData);
});

test('direct point-data decoding validates formats and locks cursor selections', () => {
  const {metadata, compressed} = createLayeredPDRF7Chunk();
  const positions = new Float64Array(metadata.pointCount * 3);
  const pointDataTarget = {
    positions,
    pointOffset: 0,
    scale: [1, 1, 1] as [number, number, number],
    offset: [0, 0, 0] as [number, number, number]
  };

  expect(() =>
    createLAZChunkDecoder({...metadata, pointDataRecordFormat: 2}).readPointDataBatch(
      {positions, pointOffset: 0},
      1
    )
  ).toThrow('point formats 6-10');
  expect(() =>
    createLAZChunkDecoder({...metadata, pointDataRecordFormat: 6}).readPointDataBatch(
      {positions, rawColors: new Uint16Array(3), pointOffset: 0},
      1
    )
  ).toThrow('does not contain RGB');
  expect(() =>
    createLAZChunkDecoder(metadata).readPositionDataBatch(
      {positions, colors: new Uint8Array(4), pointOffset: 0},
      1
    )
  ).toThrow('cannot request color');
  expect(() =>
    createLAZChunkDecoder(metadata).readPointDataBatch(
      {positions, nir: new Uint16Array(1), pointOffset: 0},
      1
    )
  ).toThrow('NIR output requires');
  expect(() =>
    createLAZChunkDecoder({...metadata, pointDataRecordFormat: 8}).readPointDataBatch(
      {positions, waveforms: new Uint8Array(29), pointOffset: 0},
      1
    )
  ).toThrow('Waveform output requires');

  const rawCursor = createLAZChunkDecoderCursor(compressed, metadata);
  rawCursor.decodeInto(new Uint8Array(metadata.pointDataRecordLength), 0, 1);
  expect(() => rawCursor.decodeIntoPointData(pointDataTarget, 1)).toThrow(
    'Cannot mix raw and point-data'
  );
  expect(() => rawCursor.feed(compressed)).toThrow('Only legacy');
  expect(() => rawCursor.decodeAvailableInto(new Uint8Array(1), 0, 1)).toThrow('limited to legacy');

  const selectedCursor = createLAZChunkDecoderCursor(compressed, metadata);
  selectedCursor.decodeIntoPointData(pointDataTarget, 1);
  expect(() =>
    selectedCursor.decodeIntoPointData(
      {...pointDataTarget, intensities: new Uint16Array(metadata.pointCount)},
      1
    )
  ).toThrow('Cannot change selected');
});

/** Creates a tiny deterministic layered LAZ chunk and its raw PDRF 7 records. */
function createLayeredPDRF7Chunk() {
  const metadata = {
    pointDataRecordFormat: 7,
    pointDataRecordLength: 36,
    pointCount: 2,
    point14ItemVersion: 3 as const,
    rgb14ItemVersion: 3 as const
  };
  const rawPointData = new Uint8Array(metadata.pointDataRecordLength * metadata.pointCount);
  const dataView = new DataView(rawPointData.buffer);
  for (let pointIndex = 0; pointIndex < metadata.pointCount; pointIndex++) {
    const pointOffset = pointIndex * metadata.pointDataRecordLength;
    dataView.setInt32(pointOffset, 100 + pointIndex, true);
    dataView.setInt32(pointOffset + 4, 200 + pointIndex, true);
    dataView.setInt32(pointOffset + 8, 300 + pointIndex, true);
    dataView.setUint16(pointOffset + 12, 400 + pointIndex, true);
    dataView.setUint8(pointOffset + 14, 0x11);
    dataView.setFloat64(pointOffset + 22, 500 + pointIndex, true);
    dataView.setUint16(pointOffset + 30, 10 + pointIndex, true);
    dataView.setUint16(pointOffset + 32, 20 + pointIndex, true);
    dataView.setUint16(pointOffset + 34, 30 + pointIndex, true);
  }
  return {metadata, rawPointData, compressed: encodeLAZChunk(rawPointData, metadata)};
}
