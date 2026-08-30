// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  createLAZChunkDecoderCursor,
  decodeLAZChunk,
  encodeLAZChunk,
  type LAZChunkMetadata,
  type LAZPointDataTarget
} from '@loaders.gl/loader-utils';

const LEGACY_RECORD_LENGTHS = [20, 28, 26, 34, 57, 63] as const;

test.each([
  0, 1, 2, 3, 4, 5
])('legacy PDRF %i projects every represented field directly into typed arrays', pointDataRecordFormat => {
  const {rawPointData, metadata} = createLegacyFixture(pointDataRecordFormat);
  const compressed = padLegacyChunk(encodeLAZChunk(rawPointData, metadata));
  const decodedRecords = decodeLAZChunk(compressed, metadata);
  const target = createCompleteTarget(metadata);

  expect(
    createLAZChunkDecoderCursor(compressed, metadata).decodeIntoPointData(
      target,
      metadata.pointCount
    )
  ).toBe(metadata.pointCount);
  expectLegacyTarget(target, decodedRecords, metadata);

  const streamingTarget = createCompleteTarget(metadata);
  expect(
    createLAZChunkDecoderCursor(compressed, metadata).decodeAvailableIntoPointData(
      streamingTarget,
      metadata.pointCount,
      true
    )
  ).toBe(metadata.pointCount);
  expectLegacyTarget(streamingTarget, decodedRecords, metadata);
});

test('legacy PDRF 3 uses both optimized color output paths', () => {
  const {rawPointData, metadata} = createLegacyFixture(3);
  const compressed = padLegacyChunk(encodeLAZChunk(rawPointData, metadata));
  const decodedRecords = decodeLAZChunk(compressed, metadata);

  const colorsTarget: LAZPointDataTarget = {
    positions: new Float64Array(metadata.pointCount * 3),
    intensities: new Uint16Array(metadata.pointCount),
    classifications: new Uint8Array(metadata.pointCount),
    colors: new Uint8Array(metadata.pointCount * 4),
    pointOffset: 0,
    scale: [0.5, 2, 4],
    offset: [10, 20, 30]
  };
  expect(
    createLAZChunkDecoderCursor(compressed, metadata).decodeIntoPointData(
      colorsTarget,
      metadata.pointCount
    )
  ).toBe(metadata.pointCount);

  const rawColorsTarget: LAZPointDataTarget = {
    positions: new Float64Array(metadata.pointCount * 3),
    rawColors: new Uint16Array(metadata.pointCount * 3),
    pointOffset: 0,
    scale: [1, 1, 1],
    offset: [0, 0, 0]
  };
  expect(
    createLAZChunkDecoderCursor(compressed, metadata).decodeIntoPointData(
      rawColorsTarget,
      metadata.pointCount
    )
  ).toBe(metadata.pointCount);

  const streamingColorsTarget = {
    ...colorsTarget,
    positions: new Float64Array(metadata.pointCount * 3),
    intensities: new Uint16Array(metadata.pointCount),
    classifications: new Uint8Array(metadata.pointCount),
    colors: new Uint8Array(metadata.pointCount * 4)
  };
  expect(
    createLAZChunkDecoderCursor(compressed, metadata).decodeAvailableIntoPointData(
      streamingColorsTarget,
      metadata.pointCount,
      true
    )
  ).toBe(metadata.pointCount);

  const streamingRawColorsTarget = {
    ...rawColorsTarget,
    positions: new Float64Array(metadata.pointCount * 3),
    rawColors: new Uint16Array(metadata.pointCount * 3)
  };
  expect(
    createLAZChunkDecoderCursor(compressed, metadata).decodeAvailableIntoPointData(
      streamingRawColorsTarget,
      metadata.pointCount,
      true
    )
  ).toBe(metadata.pointCount);

  const firstRecord = new DataView(
    decodedRecords.buffer,
    decodedRecords.byteOffset,
    metadata.pointDataRecordLength
  );
  expect(Array.from(colorsTarget.colors!.subarray(0, 4))).toEqual([
    firstRecord.getUint16(28, true) & 0xff,
    firstRecord.getUint16(30, true) & 0xff,
    firstRecord.getUint16(32, true) & 0xff,
    255
  ]);
  expect(Array.from(rawColorsTarget.rawColors!.subarray(0, 3))).toEqual([
    firstRecord.getUint16(28, true),
    firstRecord.getUint16(30, true),
    firstRecord.getUint16(32, true)
  ]);
  expect(streamingColorsTarget.colors).toEqual(colorsTarget.colors);
  expect(streamingRawColorsTarget.rawColors).toEqual(rawColorsTarget.rawColors);
});

test.each([4, 5])('legacy PDRF %i can skip waveform output', pointDataRecordFormat => {
  const {rawPointData, metadata} = createLegacyFixture(pointDataRecordFormat);
  const compressed = padLegacyChunk(encodeLAZChunk(rawPointData, metadata));
  const target: LAZPointDataTarget = {
    positions: new Float64Array(metadata.pointCount * 3),
    gpsTimes: new Float64Array(metadata.pointCount),
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
  expect(target.positions.some(value => value !== 0)).toBe(true);
  expect(target.gpsTimes!.some(value => value !== 0)).toBe(true);
});

test.each([1, 6])('PDRF %i roundtrips every GPS predictor regime', pointDataRecordFormat => {
  const gpsTimes = createGpsPredictorValues();
  const pointDataRecordLength = pointDataRecordFormat === 1 ? 28 : 30;
  const rawPointData = new Uint8Array(gpsTimes.length * pointDataRecordLength);
  const view = new DataView(rawPointData.buffer);
  for (let pointIndex = 0; pointIndex < gpsTimes.length; pointIndex++) {
    const pointOffset = pointIndex * pointDataRecordLength;
    view.setInt32(pointOffset, 100 + pointIndex, true);
    view.setInt32(pointOffset + 4, -200 + pointIndex * 2, true);
    view.setInt32(pointOffset + 8, 300 - pointIndex, true);
    view.setUint16(pointOffset + 12, pointIndex * 13, true);
    if (pointDataRecordFormat === 1) {
      view.setUint8(pointOffset + 14, 0x09);
      view.setUint8(pointOffset + 15, pointIndex % 32);
      view.setFloat64(pointOffset + 20, gpsTimes[pointIndex], true);
    } else {
      view.setUint8(pointOffset + 14, 0x11);
      view.setUint8(pointOffset + 15, ((pointIndex % 4) << 4) | ((pointIndex % 2) << 6));
      view.setUint8(pointOffset + 16, pointIndex % 64);
      view.setFloat64(pointOffset + 22, gpsTimes[pointIndex], true);
    }
  }
  const metadata: LAZChunkMetadata = {
    pointCount: gpsTimes.length,
    pointDataRecordFormat,
    pointDataRecordLength,
    point14ItemVersion: pointDataRecordFormat === 6 ? 3 : undefined
  };
  const encoded = encodeLAZChunk(rawPointData, metadata);
  const compressed = pointDataRecordFormat === 1 ? padLegacyChunk(encoded) : encoded;
  const target: LAZPointDataTarget = {
    positions: new Float64Array(gpsTimes.length * 3),
    gpsTimes: new Float64Array(gpsTimes.length),
    pointOffset: 0,
    scale: [1, 1, 1],
    offset: [0, 0, 0]
  };

  expect(
    createLAZChunkDecoderCursor(compressed, metadata).decodeIntoPointData(target, gpsTimes.length)
  ).toBe(gpsTimes.length);
  expect(Array.from(target.gpsTimes!)).toEqual(gpsTimes);
});

/** Create compact, varied records for every interleaved LASzip point format. */
function createLegacyFixture(pointDataRecordFormat: number): {
  rawPointData: Uint8Array;
  metadata: LAZChunkMetadata;
} {
  const baseRecordLength = LEGACY_RECORD_LENGTHS[pointDataRecordFormat];
  const pointCount = 32;
  const pointDataRecordLength = baseRecordLength + 2;
  const rawPointData = new Uint8Array(pointCount * pointDataRecordLength);
  let previousWaveformOffset = 5000n;

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const recordOffset = pointIndex * pointDataRecordLength;
    const view = new DataView(
      rawPointData.buffer,
      rawPointData.byteOffset + recordOffset,
      pointDataRecordLength
    );
    const numberOfReturns = 1 + (pointIndex % 5);
    const returnNumber = 1 + (pointIndex % numberOfReturns);
    view.setInt32(0, 1000 + pointIndex * 13, true);
    view.setInt32(4, -2000 + pointIndex * pointIndex, true);
    view.setInt32(8, 50 - pointIndex * 3, true);
    view.setUint16(12, 200 + pointIndex * 17, true);
    view.setUint8(
      14,
      returnNumber |
        (numberOfReturns << 3) |
        ((pointIndex % 2) << 6) |
        (((pointIndex >> 1) % 2) << 7)
    );
    view.setUint8(15, (pointIndex % 24) | ((pointIndex % 8) << 5));
    view.setInt8(16, -16 + pointIndex);
    view.setUint8(17, pointIndex * 7);
    view.setUint16(18, 300 + pointIndex * 11, true);

    if ([1, 3, 4, 5].includes(pointDataRecordFormat)) {
      const gpsTime = pointIndex % 6 === 0 ? 1000 + pointIndex : 1000 + pointIndex * 0.001;
      view.setFloat64(20, gpsTime, true);
    }

    const colorOffset = pointDataRecordFormat === 2 ? 20 : 28;
    if ([2, 3, 5].includes(pointDataRecordFormat)) {
      view.setUint16(colorOffset, pointIndex * 1000, true);
      view.setUint16(colorOffset + 2, 65535 - pointIndex * 500, true);
      view.setUint16(colorOffset + 4, pointIndex * 257, true);
    }

    if (pointDataRecordFormat === 4 || pointDataRecordFormat === 5) {
      const waveformOffset = pointDataRecordFormat === 4 ? 28 : 34;
      const packetSize = 16 + pointIndex;
      let byteOffset: bigint;
      switch (pointIndex % 4) {
        case 0:
          byteOffset = previousWaveformOffset;
          break;
        case 1:
          byteOffset = previousWaveformOffset + BigInt(15 + pointIndex);
          break;
        case 2:
          byteOffset = previousWaveformOffset + BigInt(pointIndex * 7);
          break;
        default:
          byteOffset = 100000n + BigInt(pointIndex * 101);
      }
      previousWaveformOffset = byteOffset;
      view.setUint8(waveformOffset, pointIndex % 4);
      view.setBigUint64(waveformOffset + 1, byteOffset, true);
      view.setUint32(waveformOffset + 9, packetSize, true);
      view.setFloat32(waveformOffset + 13, pointIndex / 2, true);
      view.setFloat32(waveformOffset + 17, pointIndex + 1, true);
      view.setFloat32(waveformOffset + 21, pointIndex + 2, true);
      view.setFloat32(waveformOffset + 25, pointIndex + 3, true);
    }

    view.setUint8(baseRecordLength, pointIndex);
    view.setUint8(baseRecordLength + 1, 255 - pointIndex);
  }

  return {
    rawPointData,
    metadata: {pointCount, pointDataRecordFormat, pointDataRecordLength}
  };
}

/** Supply the arithmetic decoder's permitted trailing lookahead bytes. */
function padLegacyChunk(compressed: Uint8Array): Uint8Array {
  const padded = new Uint8Array(compressed.byteLength + 64);
  padded.set(compressed);
  return padded;
}

/** Build timestamps whose IEEE-754 deltas exercise every LASzip GPS predictor family. */
function createGpsPredictorValues(): number[] {
  const base = float64ToBits(1000);
  const offsets = [
    0n,
    0n,
    1n,
    2n,
    7n,
    607n,
    602n,
    582n,
    582n,
    1182n,
    1782n,
    2382n,
    2982n,
    1n << 40n,
    (1n << 40n) + 1n,
    12n,
    13n,
    2n << 40n,
    (2n << 40n) + 2n,
    14n
  ];
  return offsets.map(offset => bitsToFloat64(base + offset));
}

/** Return the IEEE-754 bit pattern for a JavaScript number. */
function float64ToBits(value: number): bigint {
  const bytes = new ArrayBuffer(8);
  new DataView(bytes).setFloat64(0, value, true);
  return new DataView(bytes).getBigUint64(0, true);
}

/** Construct a JavaScript number from an IEEE-754 bit pattern. */
function bitsToFloat64(value: bigint): number {
  const bytes = new ArrayBuffer(8);
  new DataView(bytes).setBigUint64(0, value, true);
  return new DataView(bytes).getFloat64(0, true);
}

/** Allocate every direct legacy output column that the point format can represent. */
function createCompleteTarget(metadata: LAZChunkMetadata): LAZPointDataTarget {
  const pointCount = metadata.pointCount;
  const hasGpsTime = [1, 3, 4, 5].includes(metadata.pointDataRecordFormat);
  const hasColor = [2, 3, 5].includes(metadata.pointDataRecordFormat);
  const hasWaveform = metadata.pointDataRecordFormat === 4 || metadata.pointDataRecordFormat === 5;
  return {
    positions: new Float64Array(pointCount * 3),
    intensities: new Uint16Array(pointCount),
    classifications: new Uint8Array(pointCount),
    syntheticFlags: new Uint8Array(pointCount),
    keyPointFlags: new Uint8Array(pointCount),
    withheldFlags: new Uint8Array(pointCount),
    overlapFlags: new Uint8Array(pointCount),
    gpsTimes: hasGpsTime ? new Float64Array(pointCount) : undefined,
    scanAngles: new Int16Array(pointCount),
    userData: new Uint8Array(pointCount),
    pointSourceIds: new Uint16Array(pointCount),
    returnNumbers: new Uint8Array(pointCount),
    numberOfReturns: new Uint8Array(pointCount),
    scannerChannels: new Uint8Array(pointCount),
    scanDirectionFlags: new Uint8Array(pointCount),
    edgeOfFlightLines: new Uint8Array(pointCount),
    waveforms: hasWaveform ? new Uint8Array(pointCount * 29) : undefined,
    extraBytes: new Uint8Array(pointCount * 2),
    rawColors: hasColor ? new Uint16Array(pointCount * 3) : undefined,
    pointOffset: 0,
    scale: [0.5, 2, 4],
    offset: [10, 20, 30]
  };
}

/** Check direct columns against the authoritative decoded LAS record bytes. */
function expectLegacyTarget(
  target: LAZPointDataTarget,
  decodedRecords: Uint8Array,
  metadata: LAZChunkMetadata
): void {
  const baseRecordLength = LEGACY_RECORD_LENGTHS[metadata.pointDataRecordFormat];
  const colorOffset = metadata.pointDataRecordFormat === 2 ? 20 : 28;
  const waveformOffset = metadata.pointDataRecordFormat === 4 ? 28 : 34;

  for (let pointIndex = 0; pointIndex < metadata.pointCount; pointIndex++) {
    const recordOffset = pointIndex * metadata.pointDataRecordLength;
    const view = new DataView(
      decodedRecords.buffer,
      decodedRecords.byteOffset + recordOffset,
      metadata.pointDataRecordLength
    );
    const positionOffset = pointIndex * 3;
    expect(Array.from(target.positions.subarray(positionOffset, positionOffset + 3))).toEqual([
      view.getInt32(0, true) * 0.5 + 10,
      view.getInt32(4, true) * 2 + 20,
      view.getInt32(8, true) * 4 + 30
    ]);
    expect(target.intensities![pointIndex]).toBe(view.getUint16(12, true));
    expect(target.classifications![pointIndex]).toBe(view.getUint8(15) & 0x1f);
    expect(target.syntheticFlags![pointIndex]).toBe((view.getUint8(15) >> 5) & 1);
    expect(target.keyPointFlags![pointIndex]).toBe((view.getUint8(15) >> 6) & 1);
    expect(target.withheldFlags![pointIndex]).toBe((view.getUint8(15) >> 7) & 1);
    expect(target.overlapFlags![pointIndex]).toBe(0);
    expect(target.scanAngles![pointIndex]).toBe(view.getInt8(16));
    expect(target.userData![pointIndex]).toBe(view.getUint8(17));
    expect(target.pointSourceIds![pointIndex]).toBe(view.getUint16(18, true));
    expect(target.returnNumbers![pointIndex]).toBe(view.getUint8(14) & 0x07);
    expect(target.numberOfReturns![pointIndex]).toBe((view.getUint8(14) >> 3) & 0x07);
    expect(target.scannerChannels![pointIndex]).toBe(0);
    expect(target.scanDirectionFlags![pointIndex]).toBe((view.getUint8(14) >> 6) & 1);
    expect(target.edgeOfFlightLines![pointIndex]).toBe((view.getUint8(14) >> 7) & 1);
    expect(Array.from(target.extraBytes!.subarray(pointIndex * 2, pointIndex * 2 + 2))).toEqual([
      view.getUint8(baseRecordLength),
      view.getUint8(baseRecordLength + 1)
    ]);

    if (target.gpsTimes) {
      expect(target.gpsTimes[pointIndex]).toBe(view.getFloat64(20, true));
    }
    if (target.rawColors) {
      const targetColorOffset = pointIndex * 3;
      expect(
        Array.from(target.rawColors.subarray(targetColorOffset, targetColorOffset + 3))
      ).toEqual([
        view.getUint16(colorOffset, true),
        view.getUint16(colorOffset + 2, true),
        view.getUint16(colorOffset + 4, true)
      ]);
    }
    if (target.waveforms) {
      expect(Array.from(target.waveforms.subarray(pointIndex * 29, pointIndex * 29 + 29))).toEqual(
        Array.from(
          decodedRecords.subarray(recordOffset + waveformOffset, recordOffset + waveformOffset + 29)
        )
      );
    }
  }
}
