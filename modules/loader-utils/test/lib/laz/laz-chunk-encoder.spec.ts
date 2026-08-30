import {expect, test} from 'vitest';
import {
  createLAZChunkDecoder,
  createLAZChunkEncoder,
  createLAZChunkDecoderCursor,
  decodeLAZChunk,
  decodeLAZChunkInBatches,
  decodeLAZChunkTable,
  encodeLAZChunk,
  encodeLASzipVLR,
  encodeLAZChunkTable,
  getLAZChunkByteLength
} from '@loaders.gl/loader-utils';

test('LAZChunkDecoder#supports feedable and batched layered decoding', async () => {
  const {rawPointData, metadata} = createLAZEncodingFixture(8);
  const compressed = encodeLAZChunk(rawPointData, metadata);
  const decoder = createLAZChunkDecoder(metadata);

  expect(decoder.remainingPointCount).toBe(metadata.pointCount);
  expect(() => decoder.decode()).toThrow(/input is not closed/);
  decoder.feed(compressed.subarray(0, 8));
  expect(decoder.readBatch(7)).toBeNull();
  decoder.feed(compressed.subarray(8));

  const batches: Uint8Array[] = [];
  for (let batch = decoder.readBatch(7); batch; batch = decoder.readBatch(7)) {
    batches.push(batch);
  }
  expect(decoder.remainingPointCount).toBe(0);
  expect(concatenateTestBytes(batches)).toEqual(rawPointData);

  decoder.close();
  expect(() => decoder.feed(new Uint8Array(1))).toThrow(/closed LAZ chunk decoder/);
  expect(decoder.decode()).toEqual(rawPointData);

  const streamed: Uint8Array[] = [];
  for await (const batch of decodeLAZChunkInBatches(
    [compressed.subarray(0, 17), compressed.subarray(17)],
    metadata,
    {batchSize: 9}
  )) {
    streamed.push(batch);
  }
  expect(streamed.map(batch => batch.byteLength / metadata.pointDataRecordLength)).toEqual([
    9, 9, 9, 5
  ]);
  expect(concatenateTestBytes(streamed)).toEqual(rawPointData);
});

test('LAZChunkDecoder#validates progressive point-data selections', () => {
  const target = {
    positions: new Float64Array(3),
    pointOffset: 0,
    scale: [1, 1, 1] as [number, number, number],
    offset: [0, 0, 0] as [number, number, number]
  };

  expect(() =>
    createLAZChunkDecoder({
      pointCount: 1,
      pointDataRecordFormat: 5,
      pointDataRecordLength: 63
    }).readPointDataBatch(target, 1)
  ).toThrow(/require point formats 6-10/);
  expect(() =>
    createLAZChunkDecoder({
      pointCount: 1,
      pointDataRecordFormat: 6,
      pointDataRecordLength: 30
    }).readPointDataBatch({...target, colors: new Uint8Array(4)}, 1)
  ).toThrow(/does not contain RGB/);
  expect(() =>
    createLAZChunkDecoder({
      pointCount: 1,
      pointDataRecordFormat: 7,
      pointDataRecordLength: 36
    }).readPointDataBatch({...target, nir: new Uint16Array(1)}, 1)
  ).toThrow(/NIR output requires/);
  expect(() =>
    createLAZChunkDecoder({
      pointCount: 1,
      pointDataRecordFormat: 8,
      pointDataRecordLength: 38
    }).readPointDataBatch({...target, waveforms: new Uint8Array(29)}, 1)
  ).toThrow(/Waveform output requires/);
  expect(() =>
    createLAZChunkDecoder({
      pointCount: 1,
      pointDataRecordFormat: 8,
      pointDataRecordLength: 38
    }).readPositionDataBatch({...target, rawColors: new Uint16Array(3)}, 1)
  ).toThrow(/cannot request color or NIR/);
});
test('LAZChunkEncoder#encodes LASzip v3 PDRF 6-8 chunks', () => {
  for (const pointDataRecordFormat of [6, 7, 8]) {
    const {rawPointData, metadata} = createLAZEncodingFixture(pointDataRecordFormat);
    const compressed = encodeLAZChunk(rawPointData, metadata);
    expect(decodeLAZChunk(compressed, metadata), `PDRF ${pointDataRecordFormat} roundtrip`).toEqual(
      rawPointData
    );
    expect(
      encodeLAZChunk(rawPointData, metadata),
      `PDRF ${pointDataRecordFormat} output is deterministic`
    ).toEqual(compressed);
    expect(
      getLAZChunkByteLength(compressed, metadata),
      `PDRF ${pointDataRecordFormat} layered size headers are complete`
    ).toBe(compressed.byteLength);
  }
});

test.each([
  [0, 20],
  [1, 28],
  [2, 26],
  [3, 34]
])('LAZChunkEncoder#roundtrips legacy PDRF %s records', (pointDataRecordFormat, recordLength) => {
  const pointCount = 3;
  const rawPointData = new Uint8Array(pointCount * recordLength);
  const dataView = new DataView(rawPointData.buffer);
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const offset = pointIndex * recordLength;
    dataView.setInt32(offset, 100 + pointIndex, true);
    dataView.setInt32(offset + 4, -200 - pointIndex, true);
    dataView.setInt32(offset + 8, 300 + pointIndex, true);
    dataView.setUint16(offset + 12, 50 + pointIndex, true);
    dataView.setUint8(offset + 14, 0x20 | pointIndex);
    dataView.setUint8(offset + 15, 4 + pointIndex);
    dataView.setInt8(offset + 16, -2 - pointIndex);
    dataView.setUint8(offset + 17, 9 + pointIndex);
    dataView.setUint16(offset + 18, 1000 + pointIndex, true);
    if (pointDataRecordFormat === 1 || pointDataRecordFormat === 3) {
      dataView.setFloat64(offset + 20, 123.5 + pointIndex, true);
    }
    if (pointDataRecordFormat === 3) {
      dataView.setUint16(offset + 28, 100 + pointIndex, true);
      dataView.setUint16(offset + 30, 200 + pointIndex, true);
      dataView.setUint16(offset + 32, 300 + pointIndex, true);
    }
  }
  const metadata = {pointCount, pointDataRecordFormat, pointDataRecordLength: recordLength};
  const decoded = decodeLAZChunk(encodeLAZChunk(rawPointData, metadata), metadata);
  const decodedDataView = new DataView(decoded.buffer, decoded.byteOffset, decoded.byteLength);
  expect(decoded.byteLength).toBe(rawPointData.byteLength);
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const offset = pointIndex * recordLength;
    expect(
      Math.abs(decodedDataView.getInt32(offset, true) - (100 + pointIndex))
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(decodedDataView.getInt32(offset + 4, true) + 200 + pointIndex)
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(decodedDataView.getInt32(offset + 8, true) - (300 + pointIndex))
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(decodedDataView.getUint16(offset + 12, true) - (50 + pointIndex))
    ).toBeLessThanOrEqual(1);
  }
});
test('LAZChunkDecoder#decodes modern Extra Bytes directly into point-data targets', () => {
  for (const pointDataRecordFormat of [6, 7, 8]) {
    const {rawPointData, metadata} = createLAZEncodingFixture(pointDataRecordFormat);
    const compressed = encodeLAZChunk(rawPointData, metadata);
    const extraBytes = new Uint8Array(metadata.pointCount * 2);
    const positions = new Float64Array(metadata.pointCount * 3);
    const cursor = createLAZChunkDecoderCursor(compressed, metadata);
    cursor.decodeIntoPointData(
      {
        positions,
        extraBytes,
        pointOffset: 0,
        scale: [1, 1, 1],
        offset: [0, 0, 0]
      },
      metadata.pointCount
    );
    const expectedExtraBytes = new Uint8Array(metadata.pointCount * 2);
    for (let pointIndex = 0; pointIndex < metadata.pointCount; pointIndex++) {
      const sourceOffset =
        pointIndex * metadata.pointDataRecordLength + metadata.pointDataRecordLength - 2;
      expectedExtraBytes.set(rawPointData.subarray(sourceOffset, sourceOffset + 2), pointIndex * 2);
    }
    const mismatchIndex = extraBytes.findIndex(
      (value, index) => value !== expectedExtraBytes[index]
    );
    expect(
      mismatchIndex,
      `PDRF ${pointDataRecordFormat} Extra Bytes (first mismatch ${mismatchIndex}: ${extraBytes[mismatchIndex]} vs ${expectedExtraBytes[mismatchIndex]})`
    ).toBe(-1);
  }
});
test('LAZChunkDecoder#projects every modern point field without materializing records', () => {
  const {rawPointData, metadata} = createLAZEncodingFixture(10);
  const compressed = encodeLAZChunk(rawPointData, metadata);
  const pointCount = metadata.pointCount;
  const target = {
    positions: new Float64Array(pointCount * 3),
    intensities: new Uint16Array(pointCount),
    classifications: new Uint8Array(pointCount),
    syntheticFlags: new Uint8Array(pointCount),
    keyPointFlags: new Uint8Array(pointCount),
    withheldFlags: new Uint8Array(pointCount),
    overlapFlags: new Uint8Array(pointCount),
    gpsTimes: new Float64Array(pointCount),
    nir: new Uint16Array(pointCount),
    scanAngles: new Int16Array(pointCount),
    userData: new Uint8Array(pointCount),
    pointSourceIds: new Uint16Array(pointCount),
    returnNumbers: new Uint8Array(pointCount),
    numberOfReturns: new Uint8Array(pointCount),
    scannerChannels: new Uint8Array(pointCount),
    scanDirectionFlags: new Uint8Array(pointCount),
    edgeOfFlightLines: new Uint8Array(pointCount),
    waveforms: new Uint8Array(pointCount * 29),
    extraBytes: new Uint8Array(pointCount * 2),
    rawColors: new Uint16Array(pointCount * 3),
    pointOffset: 0,
    scale: [0.5, 2, 4] as [number, number, number],
    offset: [10, 20, 30] as [number, number, number]
  };

  const decodedPointCount = createLAZChunkDecoderCursor(compressed, metadata).decodeIntoPointData(
    target,
    pointCount - 1
  );

  expect(decodedPointCount).toBe(pointCount - 1);
  expect(Array.from(target.positions.subarray(0, 3))).toEqual([510, -3980, 230]);
  expect(target.intensities[1]).toBe(217);
  expect(target.gpsTimes[1]).toBeCloseTo(1_000_000_000.001);
  expect(Array.from(target.rawColors.subarray(3, 6))).toEqual([1000, 65035, 257]);
  expect(target.nir[1]).toBe(333);
  expect(target.waveforms.some(value => value !== 0)).toBe(true);
  expect(Array.from(target.extraBytes.subarray(0, 2))).toEqual([0, 255]);

  const rgba = new Uint8Array(pointCount * 4);
  createLAZChunkDecoderCursor(compressed, metadata).decodeIntoPointData(
    {
      positions: new Float32Array(pointCount * 3),
      colors: rgba,
      pointOffset: 0,
      scale: [1, 1, 1],
      offset: [0, 0, 0]
    },
    pointCount
  );
  expect(Array.from(rgba.subarray(4, 8))).toEqual([232, 11, 1, 255]);
});

test('LAZChunkDecoder#progressively skips unrequested color and waveform layers', () => {
  for (const pointDataRecordFormat of [9, 10]) {
    const {rawPointData, metadata} = createLAZEncodingFixture(pointDataRecordFormat);
    const compressed = encodeLAZChunk(rawPointData, metadata);
    const decoder = createLAZChunkDecoder(metadata);
    const target = {
      positions: new Float64Array(metadata.pointCount * 3),
      pointOffset: 0,
      scale: [1, 1, 1] as [number, number, number],
      offset: [0, 0, 0] as [number, number, number]
    };

    decoder.feed(compressed.subarray(0, getLAZChunkByteLength(compressed, metadata)));
    expect(decoder.readPositionDataBatch(target, metadata.pointCount)).toBe(metadata.pointCount);
    expect(decoder.readPositionDataBatch(target, 1)).toBe(0);
  }
});
test('LAZChunkEncoder#feedable input preserves view ranges', () => {
  const {rawPointData, metadata} = createLAZEncodingFixture(8);
  const padded = new Uint8Array(rawPointData.byteLength + 16);
  padded.set(rawPointData, 8);
  const encoder = createLAZChunkEncoder(metadata);
  const splitOffset = Math.floor(rawPointData.byteLength / 2);
  encoder.feed(padded.subarray(8, 8 + splitOffset));
  encoder.feed(padded.subarray(8 + splitOffset, 8 + rawPointData.byteLength));
  expect(() => encoder.encode(), 'feedable encoder requires close before encode').toThrow(
    /input is not closed/
  );
  encoder.close();
  expect(
    () => encoder.feed(new Uint8Array(1)),
    'closed feedable encoder rejects more input'
  ).toThrow(/closed LAZ chunk encoder/);
  expect(
    decodeLAZChunk(encoder.encode(), metadata),
    'feedable encoder preserves input view byte ranges'
  ).toEqual(rawPointData);
});
test('LAZChunkEncoder#validates input and item versions', () => {
  const {rawPointData, metadata} = createLAZEncodingFixture(6);
  expect(
    () =>
      encodeLASzipVLR({
        pointDataRecordFormat: 6,
        pointDataRecordLength: 30,
        chunkSize: 1,
        itemVersion: 2
      }),
    'modern item version overrides are rejected'
  ).toThrow(/Modern LASzip point formats require item version 3/);
  expect(
    () =>
      encodeLASzipVLR({
        pointDataRecordFormat: 0,
        pointDataRecordLength: 20,
        chunkSize: 1,
        itemVersion: 3
      }),
    'legacy item version overrides are rejected'
  ).toThrow(/Legacy LASzip point formats require item version 2/);
  expect(
    () =>
      encodeLASzipVLR({
        pointDataRecordFormat: 0,
        pointDataRecordLength: 20,
        chunkSize: 1,
        itemVersion: 3
      }),
    'legacy item version overrides are rejected'
  ).toThrow(/Legacy LASzip point formats require item version 2/);
  expect(
    () => encodeLAZChunk(rawPointData.subarray(1), metadata),
    'incomplete point data is rejected'
  ).toThrow(/expected/);
  expect(
    () => encodeLAZChunk(rawPointData, {...metadata, point14ItemVersion: 4}),
    'unsupported Point14 versions are rejected'
  ).toThrow(/only supports Point14 item version 3/);
  expect(() => encodeLAZChunk(new Uint8Array(0), {...metadata, pointCount: -1})).toThrow(
    /Invalid LAZ chunk point count/
  );
  expect(() =>
    encodeLAZChunk(new Uint8Array(0), {...metadata, pointCount: 0, pointDataRecordFormat: 11})
  ).toThrow(/does not support point format/);
  expect(() =>
    encodeLAZChunk(new Uint8Array(0), {...metadata, pointCount: 0, pointDataRecordLength: 29})
  ).toThrow(/Invalid point record length/);
  const colorFixture = createLAZEncodingFixture(7);
  expect(() =>
    encodeLAZChunk(colorFixture.rawPointData, {
      ...colorFixture.metadata,
      rgb14ItemVersion: 4
    })
  ).toThrow(/only supports RGB14 item version 3/);
  expect(() => encodeLAZChunk(rawPointData, {...metadata, byte14ItemVersion: 4})).toThrow(
    /only supports Byte14 item version 3/
  );
});

test('LAZChunkEncoder#describes every LAS point format and validates chunk tables', () => {
  const recordLengths = [20, 28, 26, 34, 57, 63, 30, 36, 38, 59, 67];
  for (let pointDataRecordFormat = 0; pointDataRecordFormat <= 10; pointDataRecordFormat++) {
    const baseLength = recordLengths[pointDataRecordFormat];
    const vlr = encodeLASzipVLR({
      pointDataRecordFormat,
      pointDataRecordLength: baseLength + 2,
      chunkSize: 1024
    });
    const dataView = new DataView(vlr.buffer, vlr.byteOffset, vlr.byteLength);
    expect(dataView.getUint16(18, true)).toBe(22204);
    expect(dataView.getUint16(54 + 32, true)).toBeGreaterThan(1);
  }

  expect(
    encodeLAZChunk(new Uint8Array(0), {
      pointCount: 0,
      pointDataRecordFormat: 6,
      pointDataRecordLength: 30
    })
  ).toEqual(new Uint8Array(0));
  expect(encodeLAZChunkTable([])).toEqual(new Uint8Array(0));
  expect(() => encodeLAZChunkTable([{pointCount: 1, byteLength: 0}])).toThrow(
    /Invalid LAZ chunk byte length/
  );
  expect(() =>
    encodeLASzipVLR({
      pointDataRecordFormat: 11,
      pointDataRecordLength: 67,
      chunkSize: 1
    })
  ).toThrow(/Invalid point record length/);
});
test('LAZChunkEncoder#roundtrips legacy waveform items', () => {
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
    expect(
      mismatchIndex,
      `PDRF ${pointDataRecordFormat} waveform item roundtrips (first mismatch ${mismatchIndex})`
    ).toBe(-1);
  }
});
test('LAZChunkEncoder#writes legacy waveform LASzip item descriptors', () => {
  const vlr = encodeLASzipVLR({
    pointDataRecordFormat: 5,
    pointDataRecordLength: 63,
    chunkSize: 50000
  });
  const dataView = new DataView(vlr.buffer, vlr.byteOffset, vlr.byteLength);
  const itemOffset = 54 + 34;
  expect(
    [0, 1, 2, 3].map(index => [
      dataView.getUint16(itemOffset + index * 6, true),
      dataView.getUint16(itemOffset + index * 6 + 2, true),
      dataView.getUint16(itemOffset + index * 6 + 4, true)
    ]),
    'PDRF 5 items use the LASzip v1 waveform descriptor'
  ).toEqual([
    [6, 20, 2],
    [7, 8, 2],
    [8, 6, 2],
    [9, 29, 1]
  ]);
});
test('LAZChunkEncoder#roundtrips modern waveform items', () => {
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
    expect(
      decodeLAZChunk(compressed, metadata),
      `PDRF ${pointDataRecordFormat} waveform item roundtrips`
    ).toEqual(rawPointData);
  }
});
test('LAZChunkEncoder#encodes LASzip v2 PDRF 0 chunks', () => {
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
  expect(decodeLAZChunk(compressed, metadata), 'PDRF 0 roundtrips').toEqual(rawPointData);
  expect(encodeLAZChunk(rawPointData, metadata), 'PDRF 0 output is deterministic').toEqual(
    compressed
  );
});
test('LAZChunkEncoder#encodes fixed and variable chunk tables', () => {
  const chunks = [
    {pointCount: 50000, byteLength: 100000},
    {pointCount: 50000, byteLength: 90000},
    {pointCount: 23, byteLength: 800}
  ];
  const fixedTable = encodeLAZChunkTable(chunks);
  expect(
    decodeLAZChunkTable(fixedTable, {
      chunkCount: chunks.length,
      pointCount: 100023,
      chunkSize: 50000,
      variable: false
    }),
    'fixed-size chunk table roundtrips'
  ).toEqual(chunks);
  const variableTable = encodeLAZChunkTable(chunks, {variable: true});
  expect(
    decodeLAZChunkTable(variableTable, {
      chunkCount: chunks.length,
      pointCount: 100023,
      chunkSize: 0xffffffff,
      variable: true
    }),
    'variable-size chunk table roundtrips'
  ).toEqual(chunks);
  expect(
    () => encodeLAZChunkTable([{pointCount: 0, byteLength: 1}]),
    'empty chunks are rejected'
  ).toThrow(/Invalid LAZ chunk point count/);
});
/** Create varied LAS 1.4 records for shared LAZ encoder tests. */
function createLAZEncodingFixture(pointDataRecordFormat: number) {
  const baseRecordLength = {6: 30, 7: 36, 8: 38, 9: 59, 10: 67}[pointDataRecordFormat];
  if (!baseRecordLength) {
    throw new Error(`Unsupported fixture point format ${pointDataRecordFormat}`);
  }
  const pointCount = 32;
  const pointDataRecordLength = baseRecordLength + 2;
  const rawPointData = new Uint8Array(pointCount * pointDataRecordLength);
  let previousGpsTime = 1000000000;
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
    const gpsTime = pointIndex % 7 === 0 ? previousGpsTime : 1000000000 + pointIndex * 0.001;
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
    if ([7, 8, 10].includes(pointDataRecordFormat)) {
      view.setUint16(30, pointIndex * 1000, true);
      view.setUint16(32, 65535 - pointIndex * 500, true);
      view.setUint16(34, pointIndex * 257, true);
    }
    if (pointDataRecordFormat === 8 || pointDataRecordFormat === 10) {
      view.setUint16(36, pointIndex * 333, true);
    }
    if (pointDataRecordFormat === 9 || pointDataRecordFormat === 10) {
      const waveformOffset = pointDataRecordFormat === 9 ? 30 : 38;
      view.setUint8(waveformOffset, pointIndex % 4);
      view.setBigUint64(waveformOffset + 1, BigInt(5000 + pointIndex * 20), true);
      view.setUint32(waveformOffset + 9, 16 + pointIndex, true);
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
    metadata: {
      pointCount,
      pointDataRecordFormat,
      pointDataRecordLength,
      point14ItemVersion: 3 as const,
      rgb14ItemVersion: 3 as const,
      wavePacketItemVersion: 3 as const,
      byte14ItemVersion: 3 as const
    }
  };
}

/** Concatenate byte batches without depending on implementation helpers. */
function concatenateTestBytes(chunks: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0));
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}
