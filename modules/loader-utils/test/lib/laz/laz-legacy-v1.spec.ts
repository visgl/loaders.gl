// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import {
  createLAZChunkDecoderCursor,
  decodeLAZChunk,
  encodeLAZChunk,
  NeedsMoreData,
  type LAZPointDataTarget
} from '@loaders.gl/loader-utils';
import {loadLegacyLAZFixture, type LegacyLAZFixture} from './legacy-laz-fixtures';

let fixtures: LegacyLAZFixture[];
beforeAll(async () => {
  fixtures = await Promise.all(
    [0, 1, 2, 3, 4, 5].map(pointDataRecordFormat => loadLegacyLAZFixture(pointDataRecordFormat))
  );
});

test.each([
  0, 1, 2, 3, 4, 5
])('LASzip v1 PDRF %i decodes every raw byte and represented column', pointDataRecordFormat => {
  const fixture = fixtures[pointDataRecordFormat];
  const {metadata, rawPointData} = fixture;
  const compressed = fixture.compressedFile.subarray(fixture.pointsOffset);
  expect(decodeLAZChunk(compressed, metadata)).toEqual(rawPointData);
  const target: LAZPointDataTarget = {
    positions: new Float64Array(metadata.pointCount * 3),
    intensities: new Uint16Array(metadata.pointCount),
    classifications: new Uint8Array(metadata.pointCount),
    gpsTimes: [1, 3, 4, 5].includes(pointDataRecordFormat)
      ? new Float64Array(metadata.pointCount)
      : null,
    rawColors: [2, 3, 5].includes(pointDataRecordFormat)
      ? new Uint16Array(metadata.pointCount * 3)
      : null,
    waveforms: pointDataRecordFormat >= 4 ? new Uint8Array(metadata.pointCount * 29) : null,
    extraBytes: new Uint8Array(metadata.pointCount * 4),
    scanAngles: new Int16Array(metadata.pointCount),
    userData: new Uint8Array(metadata.pointCount),
    pointSourceIds: new Uint16Array(metadata.pointCount),
    returnNumbers: new Uint8Array(metadata.pointCount),
    numberOfReturns: new Uint8Array(metadata.pointCount),
    pointOffset: 0,
    scale: [1, 1, 1],
    offset: [0, 0, 0]
  };
  expect(
    createLAZChunkDecoderCursor(compressed, metadata).decodeIntoPointData(
      target,
      metadata.pointCount
    )
  ).toBe(metadata.pointCount);
  const records = new DataView(
    rawPointData.buffer,
    rawPointData.byteOffset,
    rawPointData.byteLength
  );
  for (let pointIndex = 0; pointIndex < metadata.pointCount; pointIndex++) {
    const recordOffset = pointIndex * metadata.pointDataRecordLength;
    for (let axisIndex = 0; axisIndex < 3; axisIndex++)
      expect(target.positions[pointIndex * 3 + axisIndex]).toBe(
        records.getInt32(recordOffset + axisIndex * 4, true)
      );
    expect(target.intensities![pointIndex]).toBe(records.getUint16(recordOffset + 12, true));
    expect(target.classifications![pointIndex]).toBe(rawPointData[recordOffset + 15] & 31);
    expect(target.scanAngles![pointIndex]).toBe(records.getInt8(recordOffset + 16));
    expect(target.userData![pointIndex]).toBe(rawPointData[recordOffset + 17]);
    expect(target.pointSourceIds![pointIndex]).toBe(records.getUint16(recordOffset + 18, true));
    expect(target.returnNumbers![pointIndex]).toBe(rawPointData[recordOffset + 14] & 7);
    expect(target.numberOfReturns![pointIndex]).toBe((rawPointData[recordOffset + 14] >> 3) & 7);
    if (target.gpsTimes)
      expect(target.gpsTimes[pointIndex]).toBe(records.getFloat64(recordOffset + 20, true));
    if (target.rawColors) {
      const colorOffset = pointDataRecordFormat === 2 ? 20 : 28;
      for (let channelIndex = 0; channelIndex < 3; channelIndex++)
        expect(target.rawColors[pointIndex * 3 + channelIndex]).toBe(
          records.getUint16(recordOffset + colorOffset + channelIndex * 2, true)
        );
    }
    if (target.waveforms) {
      const waveformOffset = pointDataRecordFormat === 4 ? 28 : 34;
      expect(target.waveforms.subarray(pointIndex * 29, (pointIndex + 1) * 29)).toEqual(
        rawPointData.subarray(recordOffset + waveformOffset, recordOffset + waveformOffset + 29)
      );
    }
    expect(target.extraBytes!.subarray(pointIndex * 4, pointIndex * 4 + 4)).toEqual(
      rawPointData.subarray(
        recordOffset + metadata.pointDataRecordLength - 4,
        recordOffset + metadata.pointDataRecordLength
      )
    );
  }
});

test('LASzip v1 cursor preserves predictors while dropping consumed split input', () => {
  const {compressedFile, pointsOffset, rawPointData, metadata} = fixtures[3];
  const compressed = compressedFile.subarray(pointsOffset);
  const cursor = createLAZChunkDecoderCursor(new Uint8Array(0), metadata);
  const actual = new Uint8Array(rawPointData.byteLength);
  let decodedPointCount = 0;
  for (let byteOffset = 0; byteOffset < compressed.byteLength; byteOffset += 17) {
    cursor.feed(compressed.subarray(byteOffset, byteOffset + 17));
    decodedPointCount += cursor.decodeAvailableInto(
      actual,
      decodedPointCount * metadata.pointDataRecordLength,
      7
    );
    cursor.discardConsumedInput();
  }
  while (cursor.remainingPointCount) {
    decodedPointCount += cursor.decodeAvailableInto(
      actual,
      decodedPointCount * metadata.pointDataRecordLength,
      7,
      true
    );
    const consumedByteOffset = cursor.compressedByteOffset;
    cursor.discardConsumedInput();
    expect(cursor.compressedByteOffset).toBe(consumedByteOffset);
  }
  expect(decodedPointCount).toBe(metadata.pointCount);
  expect(actual).toEqual(rawPointData);
});

test('LASzip v1 rejects incomplete arithmetic data and unsupported item versions', () => {
  const {compressedFile, pointsOffset, metadata} = fixtures[3];
  const compressed = compressedFile.subarray(pointsOffset);
  expect(() => decodeLAZChunk(compressed.subarray(0, -16), metadata)).toThrow(NeedsMoreData);
  expect(() => decodeLAZChunk(compressed, {...metadata, point10ItemVersion: 3 as 1})).toThrow(
    /Unsupported legacy LASzip item version 3/
  );
  expect(() => encodeLAZChunk(fixtures[3].rawPointData, metadata)).toThrow(/legacy item version 2/);
  expect(() =>
    createLAZChunkDecoderCursor(new Uint8Array(0), {
      pointDataRecordFormat: 6,
      pointDataRecordLength: 30,
      pointCount: 0
    }).discardConsumedInput()
  ).toThrow(/Only legacy/);
});
