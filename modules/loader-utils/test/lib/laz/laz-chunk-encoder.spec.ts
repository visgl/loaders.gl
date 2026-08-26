// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  createLAZChunkEncoder,
  decodeLAZChunk,
  decodeLAZChunkTable,
  encodeLAZChunk,
  encodeLASzipVLR,
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
      encodeLASzipVLR({
        pointDataRecordFormat: 6,
        pointDataRecordLength: 30,
        chunkSize: 1,
        itemVersion: 2
      }),
    /Modern LASzip point formats require item version 3/,
    'modern item version overrides are rejected'
  );
  t.throws(
    () =>
      encodeLASzipVLR({
        pointDataRecordFormat: 0,
        pointDataRecordLength: 20,
        chunkSize: 1,
        itemVersion: 3
      }),
    /Legacy LASzip point formats require item version 2/,
    'legacy item version overrides are rejected'
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

test('LAZChunkEncoder#roundtrips legacy waveform items', t => {
  for (const pointDataRecordFormat of [4, 5] as const) {
    const pointDataRecordLength = pointDataRecordFormat === 4 ? 57 : 63;
    const rawPointData = new Uint8Array(pointDataRecordLength * 2);
    const dataView = new DataView(rawPointData.buffer);
    for (let pointIndex = 0; pointIndex < 2; pointIndex++) {
      const recordOffset = pointIndex * pointDataRecordLength;
      dataView.setInt32(recordOffset, 100, true);
      dataView.setInt32(recordOffset + 4, 200, true);
      dataView.setInt32(recordOffset + 8, 300, true);
      dataView.setUint16(recordOffset + 12, 10, true);
      dataView.setUint8(recordOffset + 14, 9);
      dataView.setUint8(recordOffset + 15, 2);
      dataView.setInt8(recordOffset + 16, -3);
      dataView.setUint16(recordOffset + 18, 7, true);
      dataView.setFloat64(recordOffset + 20, 123.5, true);
      const waveformOffset = pointDataRecordFormat === 4 ? 28 : 34;
      if (pointDataRecordFormat === 5) {
        dataView.setUint16(recordOffset + 28, 1000, true);
        dataView.setUint16(recordOffset + 30, 2000, true);
        dataView.setUint16(recordOffset + 32, 3000, true);
      }
      dataView.setUint8(recordOffset + waveformOffset, 1);
      dataView.setBigUint64(
        recordOffset + waveformOffset + 1,
        BigInt(5000 + pointIndex * 20),
        true
      );
      dataView.setUint32(recordOffset + waveformOffset + 9, 16, true);
      dataView.setInt32(recordOffset + waveformOffset + 13, 0x3f000000 + pointIndex, true);
      dataView.setInt32(recordOffset + waveformOffset + 17, 0x3f800000 + pointIndex, true);
      dataView.setInt32(recordOffset + waveformOffset + 21, 0x40000000 + pointIndex, true);
      dataView.setInt32(recordOffset + waveformOffset + 25, 0x40400000 + pointIndex, true);
    }
    const encoded = encodeLAZChunk(rawPointData, {
      pointCount: 2,
      pointDataRecordFormat,
      pointDataRecordLength
    });
    const decoded = decodeLAZChunk(encoded, {
      pointCount: 2,
      pointDataRecordFormat,
      pointDataRecordLength
    });
    const mismatchIndex = decoded.findIndex((value, index) => value !== rawPointData[index]);
    t.equal(
      mismatchIndex,
      -1,
      `PDRF ${pointDataRecordFormat} waveform item roundtrips (first mismatch ${mismatchIndex})`
    );
  }
  t.end();
});

test('LAZChunkEncoder#writes legacy waveform LASzip item descriptors', t => {
  const vlr = encodeLASzipVLR({
    pointDataRecordFormat: 5,
    pointDataRecordLength: 63,
    chunkSize: 50_000
  });
  const dataView = new DataView(vlr.buffer, vlr.byteOffset, vlr.byteLength);
  const itemOffset = 54 + 34;
  t.deepEqual(
    [0, 1, 2, 3].map(index => [
      dataView.getUint16(itemOffset + index * 6, true),
      dataView.getUint16(itemOffset + index * 6 + 2, true),
      dataView.getUint16(itemOffset + index * 6 + 4, true)
    ]),
    [
      [6, 20, 2],
      [7, 8, 2],
      [8, 6, 2],
      [9, 29, 1]
    ],
    'PDRF 5 items use the LASzip v1 waveform descriptor'
  );
  t.end();
});

test('LAZChunkEncoder#roundtrips modern waveform items', t => {
  for (const pointDataRecordFormat of [9, 10] as const) {
    const pointDataRecordLength = pointDataRecordFormat === 9 ? 59 : 67;
    const rawPointData = new Uint8Array(pointDataRecordLength * 2);
    const dataView = new DataView(rawPointData.buffer);
    for (let pointIndex = 0; pointIndex < 2; pointIndex++) {
      const recordOffset = pointIndex * pointDataRecordLength;
      dataView.setInt32(recordOffset, 100 + pointIndex, true);
      dataView.setInt32(recordOffset + 4, 200 + pointIndex, true);
      dataView.setInt32(recordOffset + 8, 300 + pointIndex, true);
      dataView.setUint16(recordOffset + 12, 10 + pointIndex, true);
      dataView.setUint8(recordOffset + 14, 0x11);
      dataView.setUint8(recordOffset + 15, 0);
      dataView.setUint8(recordOffset + 16, 2);
      dataView.setUint8(recordOffset + 17, 3);
      dataView.setInt16(recordOffset + 18, -4 + pointIndex, true);
      dataView.setUint16(recordOffset + 20, 7, true);
      dataView.setFloat64(recordOffset + 22, 123.5 + pointIndex * 0.001, true);
      if (pointDataRecordFormat === 10) {
        dataView.setUint16(recordOffset + 30, 1000 + pointIndex, true);
        dataView.setUint16(recordOffset + 32, 2000 + pointIndex, true);
        dataView.setUint16(recordOffset + 34, 3000 + pointIndex, true);
        dataView.setUint16(recordOffset + 36, 4000 + pointIndex, true);
      }
      const waveformOffset = pointDataRecordFormat === 9 ? 30 : 38;
      dataView.setUint8(recordOffset + waveformOffset, 1);
      dataView.setBigUint64(
        recordOffset + waveformOffset + 1,
        BigInt(5000 + pointIndex * 20),
        true
      );
      dataView.setUint32(recordOffset + waveformOffset + 9, 16 + pointIndex, true);
      dataView.setInt32(recordOffset + waveformOffset + 13, 0x3f000000 + pointIndex, true);
      dataView.setInt32(recordOffset + waveformOffset + 17, 0x3f800000 + pointIndex, true);
      dataView.setInt32(recordOffset + waveformOffset + 21, 0x40000000 + pointIndex, true);
      dataView.setInt32(recordOffset + waveformOffset + 25, 0x40400000 + pointIndex, true);
    }
    const metadata = {
      pointCount: 2,
      pointDataRecordFormat,
      pointDataRecordLength,
      point14ItemVersion: 3 as const,
      wavePacketItemVersion: 3 as const,
      rgb14ItemVersion: 3 as const,
      byte14ItemVersion: 3 as const
    };
    const compressed = encodeLAZChunk(rawPointData, metadata);
    t.deepEqual(
      decodeLAZChunk(compressed, metadata),
      rawPointData,
      `PDRF ${pointDataRecordFormat} waveform item roundtrips`
    );
  }
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
