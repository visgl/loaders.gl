// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {LASWriter} from '@loaders.gl/las';
import {makeMeshArrowTable} from '@loaders.gl/schema-utils';
import {LASFile as LazPerfLASFile} from '../src/lib/laz-perf/laslaz-decoder';
import {
  decodeLAZFileInBatches,
  parseLASChunkedIterator,
  parseLASHeader
} from '../src/lib/typescript/parse-las';

/** Encodes the same five records as LAS and LAZ for independent raw-record comparisons. */
function createFiles(pointDataRecordFormat: 0 | 3 | 6 | 8 | 10, variableChunkTable = false) {
  const table = makeMeshArrowTable({
    POSITION: {
      value: new Float64Array([1, 2, 3, 4, 5, 6, -7, 8, 9, 10, 11, -12, 13, 14, 15]),
      size: 3
    },
    COLOR_0: {
      value: new Uint8Array([
        10, 20, 30, 255, 40, 50, 60, 255, 70, 80, 90, 255, 100, 110, 120, 255, 130, 140, 150, 255
      ]),
      size: 4
    }
  });
  const options = {pointDataRecordFormat, chunkSize: 2, variableChunkTable};
  const uncompressed = LASWriter.encodeSync!(table, {las: {...options, format: 'las'}});
  const compressed = LASWriter.encodeSync!(table, {las: {...options, format: 'laz'}});
  const header = parseLASHeader(uncompressed);
  return {compressed, uncompressed, raw: new Uint8Array(uncompressed, header.pointsOffset)};
}

/** Collects independent raw chunks and validates progress and batch-local header offsets. */
async function collectRaw(input: Iterable<ArrayBuffer | ArrayBufferView>, batchSize = 3) {
  const bytes: number[] = [];
  const pointCounts: number[] = [];
  for await (const batch of decodeLAZFileInBatches(input, {batchSize})) {
    bytes.push(...new Uint8Array(batch.arrayBuffer));
    pointCounts.push(batch.header.pointsCount);
    expect(batch.header.pointsOffset).toBe(0);
    expect(batch.header.totalRead).toBe(pointCounts.reduce((sum, count) => sum + count, 0));
    expect(batch.header.totalToRead).toBe(5);
  }
  return {bytes: new Uint8Array(bytes), pointCounts};
}

test.each([
  0, 3, 6, 8, 10
] as const)('raw LAZ iterator preserves exact LAS records for fixed and variable PDRF %i chunks', pointDataRecordFormat => {
  for (const variableChunkTable of [false, true]) {
    const {compressed, raw} = createFiles(pointDataRecordFormat, variableChunkTable);
    const batches = [...parseLASChunkedIterator(compressed, 3)];
    expect(batches.map(batch => batch.header.pointsCount)).toEqual([3, 2]);
    expect(batches.map(batch => batch.header.totalRead)).toEqual([3, 5]);
    expect(batches.map(batch => batch.header.totalToRead)).toEqual([5, 5]);
    expect(batches.map(batch => batch.header.pointsOffset)).toEqual([0, 0]);
    expect(
      new Uint8Array(batches.flatMap(batch => [...new Uint8Array(batch.arrayBuffer)]))
    ).toEqual(raw);
    const defaultBatches = [...parseLASChunkedIterator(compressed)];
    expect(defaultBatches).toHaveLength(1);
    expect(new Uint8Array(defaultBatches[0].arrayBuffer)).toEqual(raw);
  }
});

test.each([
  3, 6
] as const)('raw LAZ streaming waits for split VLR headers and payloads in PDRF %i', async pointDataRecordFormat => {
  const {compressed, raw} = createFiles(pointDataRecordFormat);
  const headerLength = new DataView(compressed).getUint16(94, true);
  const boundaries = [headerLength, headerLength + 20, headerLength + 54, headerLength + 58];
  const inputs: ArrayBufferView[] = [];
  let offset = 0;
  for (const boundary of boundaries) {
    inputs.push(new DataView(compressed, offset, boundary - offset));
    offset = boundary;
  }
  inputs.push(new Uint8Array(compressed, offset));
  const decoded = await collectRaw(inputs);
  expect(decoded.bytes).toEqual(raw);
  expect(decoded.pointCounts).toEqual([3, 2]);
  for (const boundary of [headerLength + 20, headerLength + 58]) {
    await expect(collectRaw([compressed.slice(0, boundary)])).rejects.toThrow(
      /incomplete LAS header/
    );
  }
});

/** Rewrites the table pointer using LASzip's non-seekable marker and appends the actual pointer. */
function createFooterFile(file: ArrayBuffer) {
  const output = new Uint8Array(file.byteLength + 8);
  output.set(new Uint8Array(file));
  const view = new DataView(output.buffer);
  const pointOffset = view.getUint32(96, true);
  const tableOffset = view.getBigUint64(pointOffset, true);
  view.setBigInt64(pointOffset, -1n, true);
  view.setBigUint64(file.byteLength, tableOffset, true);
  return output;
}

test('raw LAZ streaming validates fragmented non-seekable footers instead of silently accepting them', async () => {
  const {compressed, raw} = createFiles(6);
  const file = createFooterFile(compressed);
  const fragments = [
    file.subarray(0, compressed.byteLength),
    ...Array.from({length: 8}, (_, index) =>
      file.subarray(compressed.byteLength + index, compressed.byteLength + index + 1)
    )
  ];
  expect((await collectRaw(fragments)).bytes).toEqual(raw);
  const truncated = file.subarray(0, file.length - 1);
  await expect(collectRaw([truncated])).rejects.toThrow(/non-seekable LAZ footer points to/);
  const invalid = file.slice();
  new DataView(invalid.buffer).setBigUint64(compressed.byteLength, 0n, true);
  await expect(collectRaw([invalid])).rejects.toThrow(/footer points to 0/);
});

test('raw iterators distinguish uncompressed LAS and missing input', async () => {
  const {uncompressed, raw} = createFiles(0);
  const batches = [...parseLASChunkedIterator(uncompressed, 3)];
  expect(batches.map(batch => batch.header.pointsCount)).toEqual([3, 2]);
  expect(new Uint8Array(batches.flatMap(batch => [...new Uint8Array(batch.arrayBuffer)]))).toEqual(
    raw
  );
  await expect(collectRaw([])).rejects.toThrow('incomplete LAS header');
  await expect(collectRaw([uncompressed])).rejects.toThrow('requires compressed LAZ input');
});

test('raw LAZ streaming rejects VLRs whose declared data overruns the available input', async () => {
  const {compressed} = createFiles(6);
  const invalid = compressed.slice(0);
  const view = new DataView(invalid);
  const headerLength = view.getUint16(94, true);
  view.setUint16(headerLength + 20, 65535, true);
  await expect(collectRaw([invalid.slice(0, -20), invalid.slice(-20)])).rejects.toThrow(
    /incomplete LASzip VLR/
  );
});

test('legacy GPS replacement and sequence switching interoperates with the independent laz-perf decoder', () => {
  const gpsTimes = [0, 1, 2, 2, 1e10, 1e10 + 1, 3];
  const mesh = makeMeshArrowTable({
    POSITION: {value: new Float64Array(gpsTimes.length * 3), size: 3},
    GPS_TIME: {value: Float64Array.from(gpsTimes), size: 1}
  });
  const options = {pointDataRecordFormat: 1 as const, chunkSize: gpsTimes.length};
  const uncompressed = LASWriter.encodeSync!(mesh, {las: {...options, format: 'las'}});
  const compressed = LASWriter.encodeSync!(mesh, {las: {...options, format: 'laz'}});
  const expected = new Uint8Array(uncompressed, parseLASHeader(uncompressed).pointsOffset);
  const file = new LazPerfLASFile(compressed);
  try {
    file.open();
    expect(file.getHeader().pointsCount).toBe(gpsTimes.length);
    const decoded = file.readData(gpsTimes.length);
    expect(decoded.count).toBe(gpsTimes.length);
    expect(new Uint8Array(decoded.buffer)).toEqual(expected);
  } finally {
    file.close();
  }
});
