// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  createLAZChunkDecoder,
  createLAZChunkDecoderCursor,
  decodeLAZChunkInBatches,
  encodeLAZChunk,
  getLAZChunkByteLength,
  getLAZChunkHeaderByteLength,
  NeedsMoreData
} from '@loaders.gl/loader-utils';
import type {LAZChunkMetadata, LAZPointDataTarget} from '@loaders.gl/loader-utils';

const RECORD_LENGTHS = [20, 28, 26, 34, 57, 63, 30, 36, 38, 59, 67];

/** Creates seven records that change coordinate predictors, scanner contexts, and field layers. */
function createPointChunk(
  pointDataRecordFormat: number,
  gpsTimes = [0, 1, 2, 2, 1e10, 1e10 + 1, 3],
  scannerChannelChanges = true
) {
  const baseLength = RECORD_LENGTHS[pointDataRecordFormat];
  const metadata: LAZChunkMetadata = {
    pointDataRecordFormat,
    pointDataRecordLength: baseLength + 3,
    pointCount: gpsTimes.length,
    point14ItemVersion: 3,
    rgb14ItemVersion: 3,
    byte14ItemVersion: 3,
    wavePacketItemVersion: 3
  };
  const raw = new Uint8Array(metadata.pointDataRecordLength * metadata.pointCount);
  const view = new DataView(raw.buffer);
  const coordinates = [0, 1, -2, 3, 33554432, -1, 10];
  const modern = pointDataRecordFormat >= 6;
  const colorOffset = [2, 3, 5].includes(pointDataRecordFormat)
    ? pointDataRecordFormat === 2
      ? 20
      : 28
    : [7, 8, 10].includes(pointDataRecordFormat)
      ? 30
      : undefined;
  const waveformOffset =
    pointDataRecordFormat === 4
      ? 28
      : pointDataRecordFormat === 5
        ? 34
        : pointDataRecordFormat === 9
          ? 30
          : pointDataRecordFormat === 10
            ? 38
            : undefined;
  const gpsOffset = [1, 3, 4, 5].includes(pointDataRecordFormat) ? 20 : modern ? 22 : undefined;
  for (let index = 0; index < metadata.pointCount; index++) {
    const offset = index * metadata.pointDataRecordLength;
    view.setInt32(offset, coordinates[index % coordinates.length], true);
    view.setInt32(offset + 4, -coordinates[index % coordinates.length], true);
    view.setInt32(offset + 8, index * 11 - 20, true);
    view.setUint16(offset + 12, index * 1000, true);
    view.setUint8(offset + 14, modern ? 0x21 + (index % 2) : 0x11 + (index % 2) * 9);
    if (modern) {
      view.setUint8(
        offset + 15,
        0x0f |
          ((scannerChannelChanges ? index % 4 : 0) << 4) |
          ((index % 2) << 6) |
          ((index % 2) << 7)
      );
      view.setUint8(offset + 16, 32 + index);
      view.setUint8(offset + 17, 200 + index);
      view.setInt16(offset + 18, index * 500 - 1000, true);
      view.setUint16(offset + 20, 60000 + index, true);
    } else {
      view.setUint8(offset + 15, index | 0xe0);
      view.setInt8(offset + 16, index - 3);
      view.setUint8(offset + 17, 200 + index);
      view.setUint16(offset + 18, 60000 + index, true);
    }
    if (gpsOffset !== undefined) view.setFloat64(offset + gpsOffset, gpsTimes[index], true);
    if (colorOffset !== undefined) {
      for (let channel = 0; channel < 3; channel++) {
        view.setUint16(
          offset + colorOffset + channel * 2,
          1000 + index * 37 + channel * 4096,
          true
        );
      }
    }
    if (pointDataRecordFormat === 8 || pointDataRecordFormat === 10) {
      view.setUint16(offset + 36, 1234 + index * 10, true);
    }
    if (waveformOffset !== undefined) {
      view.setUint8(offset + waveformOffset, (index % 2) + 1);
      view.setBigUint64(offset + waveformOffset + 1, BigInt(1000 + index * 100), true);
      view.setUint32(offset + waveformOffset + 9, 100 + index, true);
      for (let component = 0; component < 4; component++) {
        view.setFloat32(offset + waveformOffset + 13 + component * 4, index + component / 4, true);
      }
    }
    raw.set([index, 255 - index, index % 2], offset + baseLength);
  }
  return {
    metadata,
    raw,
    view,
    colorOffset,
    waveformOffset,
    gpsOffset,
    compressed: encodeLAZChunk(raw, metadata)
  };
}

/** Allocates represented output columns with sentinel rows before and after the requested range. */
function createTarget(
  fixture: ReturnType<typeof createPointChunk>,
  full = true,
  rawColors = true
): LAZPointDataTarget {
  const count = fixture.metadata.pointCount + 2;
  const target: LAZPointDataTarget = {
    positions: new Float64Array(count * 3).fill(-999),
    pointOffset: 1,
    scale: [0.25, 0.5, 2],
    offset: [10, -10, 100]
  };
  if (full) {
    Object.assign(target, {
      intensities: new Uint16Array(count),
      classifications: new Uint8Array(count),
      syntheticFlags: new Uint8Array(count),
      keyPointFlags: new Uint8Array(count),
      withheldFlags: new Uint8Array(count),
      overlapFlags: new Uint8Array(count),
      scanAngles: new Int16Array(count),
      userData: new Uint8Array(count),
      pointSourceIds: new Uint16Array(count),
      returnNumbers: new Uint8Array(count),
      numberOfReturns: new Uint8Array(count),
      scannerChannels: new Uint8Array(count),
      scanDirectionFlags: new Uint8Array(count),
      edgeOfFlightLines: new Uint8Array(count),
      extraBytes: new Uint8Array(count * 3)
    });
    if (fixture.gpsOffset !== undefined) target.gpsTimes = new Float64Array(count);
    if (fixture.colorOffset !== undefined) {
      if (rawColors) target.rawColors = new Uint16Array(count * 3);
      else target.colors = new Uint8Array(count * 4);
    }
    if ([8, 10].includes(fixture.metadata.pointDataRecordFormat))
      target.nir = new Uint16Array(count);
    if (fixture.waveformOffset !== undefined) target.waveforms = new Uint8Array(count * 29);
  }
  return target;
}

/** Checks typed columns against independently interpreted source records, including target offsets. */
function expectTarget(fixture: ReturnType<typeof createPointChunk>, target: LAZPointDataTarget) {
  const modern = fixture.metadata.pointDataRecordFormat >= 6;
  expect(Array.from(target.positions.slice(0, 3))).toEqual([-999, -999, -999]);
  expect(Array.from(target.positions.slice(-3))).toEqual([-999, -999, -999]);
  for (let index = 0; index < fixture.metadata.pointCount; index++) {
    const offset = index * fixture.metadata.pointDataRecordLength;
    const outputIndex = index + 1;
    expect(Array.from(target.positions.slice(outputIndex * 3, outputIndex * 3 + 3))).toEqual(
      [0, 1, 2].map(
        axis =>
          fixture.view.getInt32(offset + axis * 4, true) * target.scale[axis] + target.offset[axis]
      )
    );
    if (!target.intensities) continue;
    expect(target.intensities[outputIndex]).toBe(fixture.view.getUint16(offset + 12, true));
    expect(target.classifications![outputIndex]).toBe(modern ? 32 + index : index);
    expect(target.scanAngles![outputIndex]).toBe(modern ? index * 500 - 1000 : index - 3);
    expect(target.userData![outputIndex]).toBe(200 + index);
    expect(target.pointSourceIds![outputIndex]).toBe(60000 + index);
    expect(target.scannerChannels![outputIndex]).toBe(
      modern ? (fixture.view.getUint8(offset + 15) >> 4) & 3 : 0
    );
    expect(target.overlapFlags![outputIndex]).toBe(modern ? 1 : 0);
    expect(target.syntheticFlags![outputIndex]).toBe(1);
    expect(target.keyPointFlags![outputIndex]).toBe(1);
    expect(target.withheldFlags![outputIndex]).toBe(1);
    const returns = fixture.view.getUint8(offset + 14);
    expect(target.returnNumbers![outputIndex]).toBe(returns & (modern ? 15 : 7));
    expect(target.numberOfReturns![outputIndex]).toBe(modern ? returns >> 4 : (returns >> 3) & 7);
    if (target.gpsTimes)
      expect(target.gpsTimes[outputIndex]).toBe(
        fixture.view.getFloat64(offset + fixture.gpsOffset!, true)
      );
    if (target.rawColors) {
      expect(Array.from(target.rawColors.slice(outputIndex * 3, outputIndex * 3 + 3))).toEqual(
        [0, 1, 2].map(channel =>
          fixture.view.getUint16(offset + fixture.colorOffset! + channel * 2, true)
        )
      );
    }
    if (target.colors) {
      expect(Array.from(target.colors.slice(outputIndex * 4, outputIndex * 4 + 4))).toEqual([
        ...[0, 1, 2].map(
          channel => fixture.view.getUint16(offset + fixture.colorOffset! + channel * 2, true) & 255
        ),
        255
      ]);
    }
    if (target.nir) expect(target.nir[outputIndex]).toBe(1234 + index * 10);
    if (target.waveforms)
      expect(target.waveforms.slice(outputIndex * 29, (outputIndex + 1) * 29)).toEqual(
        fixture.raw.slice(offset + fixture.waveformOffset!, offset + fixture.waveformOffset! + 29)
      );
    expect(Array.from(target.extraBytes!.slice(outputIndex * 3, outputIndex * 3 + 3))).toEqual([
      index,
      255 - index,
      index % 2
    ]);
  }
}

test.each(
  RECORD_LENGTHS.map((_, format) => format)
)('LAZ PDRF %i writes selected point data into an offset target and preserves skipped-layer positions', format => {
  const fixture = createPointChunk(format);
  for (const [full, rawColors] of [
    [true, true],
    [true, false],
    [false, false]
  ]) {
    const target = createTarget(fixture, full, rawColors);
    const cursor = createLAZChunkDecoderCursor(fixture.compressed, fixture.metadata);
    expect(cursor.decodeIntoPointData(target, 2)).toBe(2);
    target.pointOffset = 3;
    expect(cursor.decodeIntoPointData(target, 100)).toBe(5);
    expect(cursor.decodeIntoPointData(target, 1)).toBe(0);
    expect(cursor.remainingPointCount).toBe(0);
    expectTarget(fixture, target);
  }
});

test.each([
  6, 7, 8, 9, 10
])('LAZ PDRF %i feedable decoder preserves scanner context changes and optional layers', format => {
  const fixture = createPointChunk(format);
  const target = createTarget(fixture);
  const decoder = createLAZChunkDecoder(fixture.metadata);
  decoder.feed(fixture.compressed);
  expect(decoder.readPointDataBatch(target, 100)).toBe(7);
  expect(decoder.readPointDataBatch(target, 1)).toBe(0);
  expectTarget(fixture, target);
});

test('LAZ direct streaming leaves partial legacy output untouched and restores target offsets on failure', () => {
  const fixture = createPointChunk(3);
  const target = createTarget(fixture);
  const cursor = createLAZChunkDecoderCursor(fixture.compressed.subarray(0, 2), fixture.metadata);
  expect(cursor.decodeAvailableIntoPointData(target, 7)).toBe(0);
  expect(target.pointOffset).toBe(1);
  expect(target.positions[3]).toBe(-999);
  expect(() => cursor.decodeAvailableIntoPointData(target, 7, true)).toThrow(NeedsMoreData);
  expect(target.pointOffset).toBe(1);
  const complete = createLAZChunkDecoderCursor(fixture.compressed, fixture.metadata);
  expect(complete.decodeAvailableIntoPointData(target, 7, true)).toBe(7);
  expect(complete.decodeAvailableIntoPointData(target, 1, true)).toBe(0);
  expectTarget(fixture, target);
});

test('LAZ cursors validate metadata, layered framing, and legacy-only input operations', () => {
  const fixture = createPointChunk(7);
  const cursor = createLAZChunkDecoderCursor(fixture.compressed, fixture.metadata);
  expect(cursor.requiredInputByteLength).toBe(0);
  expect(() => cursor.discardConsumedInput()).toThrow('Only legacy');
  expect(() => cursor.decodeAvailableIntoPointData(createTarget(fixture), 1)).toThrow(
    'limited to legacy'
  );
  expect(() =>
    createLAZChunkDecoderCursor(new Uint8Array(), {
      ...fixture.metadata,
      pointDataRecordFormat: 11
    }).decodeIntoPointData(createTarget(fixture), 1)
  ).toThrow('does not support');
  expect(() =>
    getLAZChunkHeaderByteLength({...fixture.metadata, pointDataRecordLength: 35})
  ).toThrow('record length');
  const header = getLAZChunkHeaderByteLength(fixture.metadata);
  const decoder = createLAZChunkDecoder(fixture.metadata);
  decoder.feed(fixture.compressed.subarray(0, header - 1));
  expect(decoder.readBatch(1)).toBeNull();
  decoder.feed(fixture.compressed.subarray(header - 1, header));
  expect(decoder.readBatch(1)).toBeNull();
  expect(decoder.readBatch(1)).toBeNull();
  expect(() =>
    getLAZChunkByteLength(fixture.compressed.subarray(0, header), fixture.metadata)
  ).toThrow(NeedsMoreData);
  expect(() =>
    getLAZChunkByteLength(fixture.compressed, {...fixture.metadata, pointDataRecordFormat: 3})
  ).toThrow('not self-describing');
});

test('LAZ legacy batch iterator drains after input closes and defaults to one complete batch', async () => {
  const fixture = createPointChunk(0);
  const batches = [];
  for await (const batch of decodeLAZChunkInBatches([fixture.compressed.buffer], fixture.metadata))
    batches.push(batch);
  expect(batches).toHaveLength(1);
  expect(batches[0]).toEqual(fixture.raw);
});

/** Makes exact timestamp bit differences without decimal-rounding ambiguity. */
function createGpsTimes(bitOffsets: number[]): number[] {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, 1, true);
  const baseBits = view.getBigUint64(0, true);
  return bitOffsets.map(offset => {
    view.setBigUint64(0, baseBits + BigInt(offset), true);
    return view.getFloat64(0, true);
  });
}

test.each([
  1, 6
])('LAZ PDRF %i preserves GPS predictor multipliers and repeated extreme corrections', format => {
  for (const bitOffsets of [
    [0, 100, 125, 130, 135, 140, 145, 150],
    [0, 1, 3, 43, 543, 1043, 1543, 2043, 2543, 2544],
    [0, 1, 0, -2, -22, -42, -62, -82, -83]
  ]) {
    const fixture = createPointChunk(format, createGpsTimes(bitOffsets), false);
    const target = createTarget(fixture);
    expect(
      createLAZChunkDecoderCursor(fixture.compressed, fixture.metadata).decodeIntoPointData(
        target,
        fixture.metadata.pointCount
      )
    ).toBe(fixture.metadata.pointCount);
    expectTarget(fixture, target);
  }
});
