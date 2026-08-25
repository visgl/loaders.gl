// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  createLAZChunkEncoder,
  decodeLAZChunk,
  decodeLAZChunkTable,
  encodeLAZChunk,
  encodeLAZChunkTable,
  getLAZChunkByteLength
} from '@loaders.gl/loader-utils';

test('LAZChunkEncoder#encodes LASzip v3 PDRF 6-8 chunks', t => {
  for (const pointDataRecordFormat of [6, 7, 8]) {
    const {rawPointData, metadata} = createLAZEncodingFixture(pointDataRecordFormat);
    const compressed = encodeLAZChunk(rawPointData, metadata);

    t.deepEqual(
      decodeLAZChunk(compressed, metadata),
      rawPointData,
      `PDRF ${pointDataRecordFormat} roundtrip`
    );
    t.deepEqual(
      encodeLAZChunk(rawPointData, metadata),
      compressed,
      `PDRF ${pointDataRecordFormat} output is deterministic`
    );
    t.equal(
      getLAZChunkByteLength(compressed, metadata),
      compressed.byteLength,
      `PDRF ${pointDataRecordFormat} layered size headers are complete`
    );
  }
  t.end();
});

test('LAZChunkEncoder#feedable input preserves view ranges', t => {
  const {rawPointData, metadata} = createLAZEncodingFixture(8);
  const padded = new Uint8Array(rawPointData.byteLength + 16);
  padded.set(rawPointData, 8);
  const encoder = createLAZChunkEncoder(metadata);
  const splitOffset = Math.floor(rawPointData.byteLength / 2);
  encoder.feed(padded.subarray(8, 8 + splitOffset));
  encoder.feed(padded.subarray(8 + splitOffset, 8 + rawPointData.byteLength));
  t.throws(
    () => encoder.encode(),
    /input is not closed/,
    'feedable encoder requires close before encode'
  );
  encoder.close();
  t.throws(
    () => encoder.feed(new Uint8Array(1)),
    /closed LAZ chunk encoder/,
    'closed feedable encoder rejects more input'
  );
  t.deepEqual(
    decodeLAZChunk(encoder.encode(), metadata),
    rawPointData,
    'feedable encoder preserves input view byte ranges'
  );
  t.end();
});

test('LAZChunkEncoder#validates input and item versions', t => {
  const {rawPointData, metadata} = createLAZEncodingFixture(6);
  t.throws(
    () =>
      encodeLAZChunk(new Uint8Array(20), {
        pointCount: 1,
        pointDataRecordFormat: 4,
        pointDataRecordLength: 57
      }),
    /does not support point format 4/,
    'waveform legacy point formats remain unsupported'
  );
  t.throws(
    () => encodeLAZChunk(rawPointData.subarray(1), metadata),
    /expected/,
    'incomplete point data is rejected'
  );
  t.throws(
    () => encodeLAZChunk(rawPointData, {...metadata, point14ItemVersion: 4}),
    /only supports Point14 item version 3/,
    'unsupported Point14 versions are rejected'
  );
  t.end();
});

test('LAZChunkEncoder#encodes LASzip v2 PDRF 0 chunks', t => {
  const pointCount = 32;
  const pointDataRecordLength = 22;
  const rawPointData = new Uint8Array(pointCount * pointDataRecordLength);
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const offset = pointIndex * pointDataRecordLength;
    const view = new DataView(rawPointData.buffer, offset, pointDataRecordLength);
    view.setInt32(0, pointIndex * 100, true);
    view.setInt32(4, -pointIndex * 50, true);
    view.setInt32(8, pointIndex * 3, true);
    view.setUint16(12, 100 + pointIndex, true);
    view.setUint8(14, 0x09);
    view.setUint8(15, pointIndex % 8);
    view.setInt8(16, (pointIndex % 7) - 3);
    view.setUint8(17, pointIndex * 2);
    view.setUint16(18, 500 + pointIndex, true);
    view.setUint8(20, pointIndex);
    view.setUint8(21, 255 - pointIndex);
  }
  const metadata = {
    pointCount,
    pointDataRecordFormat: 0,
    pointDataRecordLength
  };
  const compressed = encodeLAZChunk(rawPointData, metadata);
  t.deepEqual(decodeLAZChunk(compressed, metadata), rawPointData, 'PDRF 0 roundtrips');
  t.deepEqual(encodeLAZChunk(rawPointData, metadata), compressed, 'PDRF 0 output is deterministic');
  t.end();
});

test('LAZChunkEncoder#encodes fixed and variable chunk tables', t => {
  const chunks = [
    {pointCount: 50_000, byteLength: 100_000},
    {pointCount: 50_000, byteLength: 90_000},
    {pointCount: 23, byteLength: 800}
  ];
  const fixedTable = encodeLAZChunkTable(chunks);
  t.deepEqual(
    decodeLAZChunkTable(fixedTable, {
      chunkCount: chunks.length,
      pointCount: 100_023,
      chunkSize: 50_000,
      variable: false
    }),
    chunks,
    'fixed-size chunk table roundtrips'
  );

  const variableTable = encodeLAZChunkTable(chunks, {variable: true});
  t.deepEqual(
    decodeLAZChunkTable(variableTable, {
      chunkCount: chunks.length,
      pointCount: 100_023,
      chunkSize: 0xffffffff,
      variable: true
    }),
    chunks,
    'variable-size chunk table roundtrips'
  );
  t.throws(
    () => encodeLAZChunkTable([{pointCount: 0, byteLength: 1}]),
    /Invalid LAZ chunk point count/,
    'empty chunks are rejected'
  );
  t.end();
});

/** Create varied LAS 1.4 records for shared LAZ encoder tests. */
function createLAZEncodingFixture(pointDataRecordFormat: number) {
  const baseRecordLength = {6: 30, 7: 36, 8: 38}[pointDataRecordFormat];
  if (!baseRecordLength) {
    throw new Error(`Unsupported fixture point format ${pointDataRecordFormat}`);
  }
  const pointCount = 32;
  const pointDataRecordLength = baseRecordLength + 2;
  const rawPointData = new Uint8Array(pointCount * pointDataRecordLength);
  let previousGpsTime = 1_000_000_000;

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const recordOffset = pointIndex * pointDataRecordLength;
    const view = new DataView(
      rawPointData.buffer,
      rawPointData.byteOffset + recordOffset,
      pointDataRecordLength
    );
    const numberOfReturns = 1 + (pointIndex % 5);
    const returnNumber = 1 + (pointIndex % numberOfReturns);
    const scannerChannel = (pointIndex * 3 + 2) % 4;
    const gpsTime = pointIndex % 7 === 0 ? previousGpsTime : 1_000_000_000 + pointIndex * 0.001;
    previousGpsTime = gpsTime;

    view.setInt32(0, 1000 + pointIndex * 13, true);
    view.setInt32(4, -2000 + pointIndex * pointIndex, true);
    view.setInt32(8, 50 - pointIndex * 3, true);
    view.setUint16(12, 200 + pointIndex * 17, true);
    view.setUint8(14, returnNumber | (numberOfReturns << 4));
    view.setUint8(15, (pointIndex % 16) | (scannerChannel << 4) | ((pointIndex % 2) << 6));
    view.setUint8(16, (pointIndex * 7) & 0xff);
    view.setUint8(17, (pointIndex * 11) & 0xff);
    view.setInt16(18, -100 + pointIndex * 9, true);
    view.setUint16(20, 3 + (pointIndex >> 2), true);
    view.setFloat64(22, gpsTime, true);

    if (pointDataRecordFormat >= 7) {
      view.setUint16(30, pointIndex * 1000, true);
      view.setUint16(32, 65535 - pointIndex * 500, true);
      view.setUint16(34, pointIndex * 257, true);
    }
    if (pointDataRecordFormat === 8) {
      view.setUint16(36, pointIndex * 333, true);
    }
    view.setUint8(baseRecordLength, pointIndex);
    view.setUint8(baseRecordLength + 1, 255 - pointIndex);
  }

  return {
    rawPointData,
    metadata: {
      pointCount,
      pointDataRecordFormat,
      pointDataRecordLength,
      point14ItemVersion: 3 as const,
      rgb14ItemVersion: 3 as const,
      byte14ItemVersion: 3 as const
    }
  };
}
