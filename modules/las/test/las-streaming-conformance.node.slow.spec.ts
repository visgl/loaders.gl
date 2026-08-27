// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import '@loaders.gl/polyfills';
import {fetchFile} from '@loaders.gl/core';
import {describe, expect, test} from 'vitest';
import {
  decodeLAZFileInBatches,
  parseLAS,
  parseLASHeader,
  parseLASInBatches
} from '../src/lib/typescript/parse-las';
import type {LASLoaderOptions} from '../src/las-loader-shared';

type ConformanceFixture = {
  readonly label: string;
  readonly pointDataRecordLength: number;
  readonly lasUrl: string;
  readonly lazUrl: string;
};

type LAZStreamingStats = {
  copiedBytes: number;
  chunkConcatenations: number;
  rawBatchAllocations: number;
  decodedChunkAllocations: number;
};

const SPLIT_SEEDS = [0x4c415a01, 0x4c415a14, 0x434f5043] as const;
const MINIMUM_PDRF7_STREAMING_POINTS_PER_SECOND = 500_000;
const MINIMUM_PDRF7_RENDER_POINTS_PER_SECOND = 750_000;
const MINIMUM_SELECTIVE_SPEEDUP = 1.15;
const CONFORMANCE_FIXTURES: readonly ConformanceFixture[] = [
  {
    label: 'LAS 1.3 PDRF 4',
    pointDataRecordLength: 61,
    lasUrl: '@loaders.gl/las/test/data/pdrf4-1.3.las',
    lazUrl: '@loaders.gl/las/test/data/pdrf4-1.3.laz'
  },
  {
    label: 'LAS 1.3 PDRF 5',
    pointDataRecordLength: 67,
    lasUrl: '@loaders.gl/las/test/data/pdrf5-1.3.las',
    lazUrl: '@loaders.gl/las/test/data/pdrf5-1.3.laz'
  },
  {
    label: 'LAS 1.4 PDRF 6',
    pointDataRecordLength: 34,
    lasUrl: '@loaders.gl/las/test/data/pdrf6-1.4.las',
    lazUrl: '@loaders.gl/las/test/data/pdrf6-1.4.laz'
  },
  {
    label: 'LAS 1.4 PDRF 7 item version 4',
    pointDataRecordLength: 40,
    lasUrl: '@loaders.gl/las/test/data/pdrf7-v4-1.4.las',
    lazUrl: '@loaders.gl/las/test/data/pdrf7-v4-1.4.laz'
  },
  {
    label: 'LAS 1.4 PDRF 8',
    pointDataRecordLength: 42,
    lasUrl: '@loaders.gl/las/test/data/pdrf8-1.4.las',
    lazUrl: '@loaders.gl/las/test/data/pdrf8-1.4.laz'
  },
  {
    label: 'LAS 1.5 PDRF 9 item version 4',
    pointDataRecordLength: 63,
    lasUrl: '@loaders.gl/las/test/data/pdrf9-1.5.las',
    lazUrl: '@loaders.gl/las/test/data/pdrf9-1.5.laz'
  },
  {
    label: 'LAS 1.5 PDRF 10 item version 4',
    pointDataRecordLength: 71,
    lasUrl: '@loaders.gl/las/test/data/pdrf10-1.5.las',
    lazUrl: '@loaders.gl/las/test/data/pdrf10-1.5.laz'
  }
];

describe('TypeScript LAZ streaming conformance', () => {
  test.each(
    CONFORMANCE_FIXTURES
  )('$label preserves every raw point byte across seeded arbitrary input splits', async fixture => {
    const [lasArrayBuffer, lazArrayBuffer] = await Promise.all([
      loadArrayBuffer(fixture.lasUrl),
      loadArrayBuffer(fixture.lazUrl)
    ]);
    const expected = getLASPointData(lasArrayBuffer, fixture.pointDataRecordLength);

    for (const seed of SPLIT_SEEDS) {
      const actual = await collectRawPointData(splitArrayBufferRandomly(lazArrayBuffer, seed, 509));
      expect(actual, `seed 0x${seed.toString(16)}`).toEqual(expected);
    }
  }, 30_000);

  test('rejects malformed framing and trailing chunk tables', async () => {
    const source = await loadArrayBuffer('@loaders.gl/las/test/data/pdrf7-v4-1.4.laz');
    const header = parseLASHeader(source);
    const malformedInputs = [
      {input: source.slice(0, 374), yieldsPointData: false},
      {
        input: mutateArrayBuffer(source, dataView =>
          dataView.setUint32(96, source.byteLength + 1, true)
        ),
        yieldsPointData: false
      },
      {
        input: mutateArrayBuffer(source, dataView =>
          dataView.setBigUint64(header.pointsOffset, BigInt(source.byteLength + 1), true)
        ),
        yieldsPointData: true
      },
      {input: source.slice(0, source.byteLength - 16), yieldsPointData: true}
    ];

    for (const malformedInput of malformedInputs) {
      let yieldedPointCount = 0;
      await expect(async () => {
        for await (const batch of decodeLAZFileInBatches(
          splitArrayBufferRandomly(malformedInput.input, 0x4c415a14, 31),
          {batchSize: 127}
        )) {
          yieldedPointCount += batch.header.pointsCount;
        }
      }).rejects.toThrow(/incomplete|invalid|truncated|beyond|chunk table/i);
      if (!malformedInput.yieldsPointData) {
        expect(yieldedPointCount).toBe(0);
      }
    }

    const invalidChunkTablePointer = malformedInputs[2].input;
    expect(() => parseLAS(invalidChunkTablePointer)).toThrow(/chunk table/i);
  });

  test('accepts the LASzip non-seekable chunk-table pointer layout', async () => {
    const [lasArrayBuffer, lazArrayBuffer] = await Promise.all([
      loadArrayBuffer('@loaders.gl/las/test/data/pdrf7-v4-1.4.las'),
      loadArrayBuffer('@loaders.gl/las/test/data/pdrf7-v4-1.4.laz')
    ]);
    const sourceDataView = new DataView(lazArrayBuffer);
    const pointDataOffset = sourceDataView.getUint32(96, true);
    const chunkTableOffset = sourceDataView.getBigUint64(pointDataOffset, true);
    const streamed = new Uint8Array(lazArrayBuffer.byteLength + 8);
    streamed.set(new Uint8Array(lazArrayBuffer));
    const streamedDataView = new DataView(streamed.buffer);
    streamedDataView.setBigInt64(pointDataOffset, -1n, true);
    streamedDataView.setBigUint64(lazArrayBuffer.byteLength, chunkTableOffset, true);

    expect(parseLAS(streamed.buffer).data.numRows).toBe(1024);
    const expected = getLASPointData(lasArrayBuffer, 40);
    const actual = await collectRawPointData(
      splitArrayBufferRandomly(streamed.buffer, 0x4c415a14, 509)
    );
    expect(actual).toEqual(expected);

    await expect(
      collectRawPointData(splitArrayBufferRandomly(streamed.buffer.slice(0, -8), 0x4c415a14, 509))
    ).rejects.toThrow(/footer/i);

    const invalidFooter = streamed.slice();
    new DataView(invalidFooter.buffer).setBigUint64(
      invalidFooter.byteLength - 8,
      chunkTableOffset + 1n,
      true
    );
    await expect(
      collectRawPointData(splitArrayBufferRandomly(invalidFooter.buffer, 0x4c415a14, 509))
    ).rejects.toThrow(/footer points/i);
  });

  test('PDRF 7 Arrow streaming stays within the allocation and copy budget', async () => {
    const source = await loadArrayBuffer('@loaders.gl/las/test/data/pdrf7-v4-1.4.laz');
    const stats: LAZStreamingStats = {
      copiedBytes: 0,
      chunkConcatenations: 0,
      rawBatchAllocations: 0,
      decodedChunkAllocations: 0
    };
    const options = {
      batchSize: 127,
      las: {
        shape: 'arrow-table',
        lazStreamingStats: stats
      }
    } as LASLoaderOptions;
    let pointCount = 0;

    for await (const batch of parseLASInBatches(
      splitArrayBufferRandomly(source, 0x4c415a14, 509),
      options
    )) {
      pointCount += batch.data.numRows;
    }

    expect(pointCount).toBe(1024);
    expect(stats.rawBatchAllocations).toBe(0);
    expect(stats.decodedChunkAllocations).toBe(0);
    expect(stats.copiedBytes).toBeLessThanOrEqual(source.byteLength);
    expect(stats.chunkConcatenations).toBeLessThanOrEqual(Math.ceil(source.byteLength / 509));
  });

  test.skipIf(Boolean(process.env.LOADERS_GL_TEST_COVERAGE))(
    'PDRF 7 streaming retains its CPU throughput floor and selective advantage',
    async () => {
      const source = await loadArrayBuffer('@loaders.gl/las/test/data/ellipsoid-1.4.laz');
      const pointCount = parseLASHeader(source).pointsCount;
      const fullOptions: LASLoaderOptions = {batchSize: 25_000, las: {shape: 'arrow-table'}};
      const renderOptions: LASLoaderOptions = {
        batchSize: 25_000,
        las: {shape: 'arrow-table', columns: ['POSITION', 'COLOR_0']}
      };

      await consumeArrowBatches(source, renderOptions);
      const fullRate = await measureBestStreamingRate(source, pointCount, fullOptions);
      const renderRate = await measureBestStreamingRate(source, pointCount, renderOptions);

      expect(fullRate).toBeGreaterThanOrEqual(MINIMUM_PDRF7_STREAMING_POINTS_PER_SECOND);
      expect(renderRate).toBeGreaterThanOrEqual(MINIMUM_PDRF7_RENDER_POINTS_PER_SECOND);
      expect(renderRate / fullRate).toBeGreaterThanOrEqual(MINIMUM_SELECTIVE_SPEEDUP);
    },
    30_000
  );
});

/** Load one local LAS or LAZ fixture. */
async function loadArrayBuffer(url: string): Promise<ArrayBuffer> {
  return (await fetchFile(url)).arrayBuffer();
}

/** Return the packed point-record bytes from an uncompressed LAS file. */
function getLASPointData(arrayBuffer: ArrayBuffer, pointDataRecordLength: number): Uint8Array {
  const header = parseLASHeader(arrayBuffer);
  return new Uint8Array(
    arrayBuffer,
    header.pointsOffset,
    header.pointsCount * pointDataRecordLength
  );
}

/** Decode and concatenate raw point batches from a chunked LAZ input. */
async function collectRawPointData(chunks: AsyncIterable<ArrayBufferView>): Promise<Uint8Array> {
  const batches: Uint8Array[] = [];
  let byteLength = 0;
  for await (const batch of decodeLAZFileInBatches(chunks, {batchSize: 127})) {
    const bytes = new Uint8Array(batch.arrayBuffer);
    batches.push(bytes);
    byteLength += bytes.byteLength;
  }

  const result = new Uint8Array(byteLength);
  let offset = 0;
  for (const batch of batches) {
    result.set(batch, offset);
    offset += batch.byteLength;
  }
  return result;
}

/** Yield deterministic pseudo-random views without copying the source buffer. */
async function* splitArrayBufferRandomly(
  arrayBuffer: ArrayBuffer,
  seed: number,
  maximumChunkByteLength: number
): AsyncIterable<Uint8Array> {
  const bytes = new Uint8Array(arrayBuffer);
  let state = seed >>> 0;
  let offset = 0;
  while (offset < bytes.byteLength) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const chunkByteLength = 1 + (state % maximumChunkByteLength);
    const end = Math.min(offset + chunkByteLength, bytes.byteLength);
    yield bytes.subarray(offset, end);
    offset = end;
  }
}

/** Copy and mutate one fixture without changing the cached source bytes. */
function mutateArrayBuffer(
  arrayBuffer: ArrayBuffer,
  mutate: (dataView: DataView) => void
): ArrayBuffer {
  const result = arrayBuffer.slice(0);
  mutate(new DataView(result));
  return result;
}

/** Consume one chunked PDRF 7 file through the Arrow streaming path. */
async function consumeArrowBatches(
  arrayBuffer: ArrayBuffer,
  options: LASLoaderOptions
): Promise<void> {
  for await (const _batch of parseLASInBatches(
    splitArrayBufferRandomly(arrayBuffer, 0x4c415a14, 64 * 1024),
    options
  )) {
    _batch;
  }
}

/** Return the best of three warmed PDRF 7 streaming CPU-time measurements. */
async function measureBestStreamingRate(
  arrayBuffer: ArrayBuffer,
  pointCount: number,
  options: LASLoaderOptions
): Promise<number> {
  let bestRate = 0;
  for (let iteration = 0; iteration < 3; iteration++) {
    const startCpuUsage = process.cpuUsage();
    await consumeArrowBatches(arrayBuffer, options);
    const cpuUsage = process.cpuUsage(startCpuUsage);
    const cpuSeconds = (cpuUsage.user + cpuUsage.system) / 1_000_000;
    bestRate = Math.max(bestRate, pointCount / cpuSeconds);
  }
  return bestRate;
}
