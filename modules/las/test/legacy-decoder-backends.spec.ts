// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {
  parseLAS as parseLASWithLazPerf,
  parseLASInBatches as parseLASInBatchesWithLazPerf
} from '../src/lib/laz-perf/parse-las';
import {LASFile as LazPerfLASFile} from '../src/lib/laz-perf/laslaz-decoder';
import {
  parseLAS as parseLASWithLazRs,
  parseLASInBatches as parseLASInBatchesWithLazRs
} from '../src/lib/laz-rs-wasm/parse-las';
import {LASFile as LazRsLASFile} from '../src/lib/laz-rs-wasm/laslaz-decoder';

const POINT_FORMAT_LENGTHS = [20, 28, 26, 34];

/** Creates a compact LAS 1.2 buffer for a legacy point format. */
function createLegacyLAS(pointFormat: number, colors: [number, number, number][]): ArrayBuffer {
  const pointCount = colors.length;
  const headerLength = 227;
  const pointLength = POINT_FORMAT_LENGTHS[pointFormat];
  const arrayBuffer = new ArrayBuffer(headerLength + pointCount * pointLength);
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  bytes.set(new TextEncoder().encode('LASF'));
  bytes[24] = 1;
  bytes[25] = 2;
  view.setUint16(94, headerLength, true);
  view.setUint32(96, headerLength, true);
  bytes[104] = pointFormat;
  view.setUint16(105, pointLength, true);
  view.setUint32(107, pointCount, true);
  for (let index = 0; index < 3; index++) {
    view.setFloat64(131 + index * 8, 0.5, true);
    view.setFloat64(155 + index * 8, 10 * (index + 1), true);
  }
  for (let index = 0; index < 6; index++) {
    view.setFloat64(179 + index * 8, index % 2 ? 0 : 100, true);
  }

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const pointOffset = headerLength + pointIndex * pointLength;
    view.setInt32(pointOffset, pointIndex + 1, true);
    view.setInt32(pointOffset + 4, pointIndex + 2, true);
    view.setInt32(pointOffset + 8, pointIndex + 3, true);
    view.setUint16(pointOffset + 12, 100 + pointIndex, true);
    bytes[pointOffset + 15] = 4 + pointIndex;
    if (pointFormat === 2 || pointFormat === 3) {
      const colorOffset = pointOffset + (pointFormat === 2 ? 20 : 28);
      view.setUint16(colorOffset, colors[pointIndex][0], true);
      view.setUint16(colorOffset + 2, colors[pointIndex][1], true);
      view.setUint16(colorOffset + 4, colors[pointIndex][2], true);
    }
  }
  return arrayBuffer;
}

test('legacy LAS backends decode every supported point format without WASM', () => {
  for (let pointFormat = 0; pointFormat <= 3; pointFormat++) {
    const source = createLegacyLAS(pointFormat, [
      [100, 200, 255],
      [256, 512, 1024]
    ]);
    for (const parseLAS of [parseLASWithLazPerf, parseLASWithLazRs]) {
      const mesh = parseLAS(source, {las: {colorDepth: 'auto', fp64: true}});
      expect(mesh.header.vertexCount).toBe(2);
      expect(mesh.attributes.POSITION.value).toBeInstanceOf(Float64Array);
      expect(Array.from(mesh.attributes.POSITION.value)).toEqual([10.5, 21, 31.5, 11, 21.5, 32]);
      expect(Array.from(mesh.attributes.intensity.value)).toEqual([100, 101]);
      expect(Array.from(mesh.attributes.classification.value)).toEqual([4, 5]);
      if (pointFormat >= 2) {
        expect(Array.from(mesh.attributes.COLOR_0.value)).toEqual([0, 0, 0, 255, 1, 2, 4, 255]);
      } else {
        expect(mesh.attributes.COLOR_0).toBeUndefined();
      }
    }
  }
});

test('legacy LAS backends stream small batches and honor explicit color depth', async () => {
  const source = createLegacyLAS(2, [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
  ]);
  for (const parseLASInBatches of [parseLASInBatchesWithLazPerf, parseLASInBatchesWithLazRs]) {
    const batches = parseLASInBatches([source.slice(0, 100), source.slice(100)], {
      batchSize: 2,
      las: {colorDepth: 8}
    });
    const vertexCounts: number[] = [];
    for await (const batch of batches) {
      vertexCounts.push(batch.header.vertexCount);
      expect(batch.progress).toBeGreaterThan(0);
      expect(batch.attributes.COLOR_0.value).toHaveLength(batch.header.vertexCount * 4);
      expect(batch.attributes.COLOR_0.value[3]).toBe(255);
    }
    expect(vertexCounts).toEqual([2, 1]);
  }
});

test('legacy LAS backend wrappers validate files and lifecycle ordering', () => {
  const source = createLegacyLAS(0, [[0, 0, 0]]);
  for (const LASFile of [LazPerfLASFile, LazRsLASFile]) {
    const file = new LASFile(source);
    expect(file.versionAsString).toBe('1.2');
    file.loader.header = null;
    expect(() => file.loader.readData(1)).toThrow('header');
    file.open();
    expect(file.isOpen).toBe(true);
    expect(file.getHeader()).toMatchObject({pointsCount: 1, pointsFormatId: 0});
    const chunk = file.readData(5);
    expect(chunk).toMatchObject({count: 1, hasMoreData: false});
    const decoder = new (file.getUnpacker())(chunk.buffer, chunk.count, file.getHeader());
    expect(decoder.getPoint(0)).toMatchObject({intensity: 100, classification: 4});
    expect(() => decoder.getPoint(-1)).toThrow('out of range');
    expect(() => decoder.getPoint(1)).toThrow('out of range');
    file.close();
    expect(file.isOpen).toBe(false);
  }
});

test('legacy LAS backends reject signatures, versions, formats, and old compression', () => {
  const invalidSignature = createLegacyLAS(0, [[0, 0, 0]]);
  new Uint8Array(invalidSignature)[0] = 0;
  expect(() => new LazRsLASFile(invalidSignature)).toThrow('Invalid LAS file');

  const unsupportedVersion = createLegacyLAS(0, [[0, 0, 0]]);
  new Uint8Array(unsupportedVersion)[25] = 5;
  expect(() => new LazPerfLASFile(unsupportedVersion)).toThrow('versions <= 1.3');
  expect(() => new LazRsLASFile(unsupportedVersion)).toThrow('versions <= 1.4');

  const unsupportedFormat = createLegacyLAS(0, [[0, 0, 0]]);
  new Uint8Array(unsupportedFormat)[104] = 63;
  expect(() => new LazPerfLASFile(unsupportedFormat)).toThrow('point format ID');
  expect(() => new LazRsLASFile(unsupportedFormat)).toThrow('point format ID');

  const oldCompression = createLegacyLAS(0, [[0, 0, 0]]);
  new Uint8Array(oldCompression)[104] = 0xc0;
  expect(() => new LazPerfLASFile(oldCompression)).toThrow('Old style compression');
  expect(() => new LazRsLASFile(oldCompression)).toThrow('Old style compression');

  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  parseLASWithLazPerf(createLegacyLAS(0, [[0, 0, 0]]), {
    las: {colorDepth: 'invalid' as any}
  });
  expect(warning).toHaveBeenCalledWith('las: illegal value for options.las.colorDepth');
  warning.mockRestore();
});
