// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile} from '@loaders.gl/core';
import {COPCTileSource} from '@loaders.gl/copc';
import type {COPCRangeReader} from '@loaders.gl/copc';

const COPC_FILE_URL = 'modules/copc/test/data/ellipsoid.copc.laz';
const RANGE_CHUNK_SIZE = 64 * 1024;
const BATCH_SIZE = 25_000;

type COPCBenchmarkStats = {
  requestCount: number;
  requestedByteCount: number;
};

/** COPC source with counters for bytes requested by the benchmark workload. */
class InstrumentedCOPCSource extends COPCTileSource {
  /** Wrap the source range reader with counters after metadata initialization. */
  instrumentRangeReader(stats: COPCBenchmarkStats): void {
    const readRange = this._readRange;
    const countedReadRange: COPCRangeReader = async (begin, end, signal) => {
      stats.requestCount++;
      stats.requestedByteCount += end - begin;
      return await readRange(begin, end, signal);
    };
    this._readRange = countedReadRange;
  }
}

/** Adds end-to-end COPC range and Arrow decode benchmarks. */
export default async function copcSourceBench(bench: any): Promise<void> {
  const response = await fetchFile(COPC_FILE_URL);
  const arrayBuffer = await response.arrayBuffer();
  const source = new InstrumentedCOPCSource(new Blob([arrayBuffer]), {
    core: {loadOptions: {core: {worker: false}}}
  });
  await source.initialize();
  const rootTile = await source.getRootTile();
  const stats: COPCBenchmarkStats = {requestCount: 0, requestedByteCount: 0};
  source.instrumentRangeReader(stats);
  await source.loadTileContent(rootTile, {
    columns: ['POSITION', 'COLOR_0', 'intensity', 'classification']
  });
  const atomicStats = formatStats(stats);
  stats.requestCount = 0;
  stats.requestedByteCount = 0;
  for await (const _batch of source.loadTileContentInBatches(rootTile, {
    batchSize: BATCH_SIZE,
    rangeChunkSize: RANGE_CHUNK_SIZE,
    columns: ['POSITION', 'COLOR_0', 'intensity', 'classification']
  })) {
    _batch;
  }
  const progressiveStats = formatStats(stats);
  const benchmarkOptions = {
    multiplier: rootTile.pointCount,
    unit: 'output points',
    minIterations: 3
  };

  bench.groupSorted('COPC PDRF 7 end-to-end Arrow decoding');
  bench.addAsync(`atomic node load · ${atomicStats}`, benchmarkOptions, async () => {
    stats.requestCount = 0;
    stats.requestedByteCount = 0;
    const content = await source.loadTileContent(rootTile, {
      columns: ['POSITION', 'COLOR_0', 'intensity', 'classification']
    });
    if (!content || content.data.data.numRows !== rootTile.pointCount) {
      throw new Error('COPC benchmark atomic load returned an invalid Arrow table');
    }
  });

  bench.addAsync(
    `progressive range load · chunks=${RANGE_CHUNK_SIZE} · ${progressiveStats}`,
    benchmarkOptions,
    async () => {
      stats.requestCount = 0;
      stats.requestedByteCount = 0;
      let pointCount = 0;
      for await (const batch of source.loadTileContentInBatches(rootTile, {
        batchSize: BATCH_SIZE,
        rangeChunkSize: RANGE_CHUNK_SIZE,
        columns: ['POSITION', 'COLOR_0', 'intensity', 'classification']
      })) {
        pointCount += batch.pointCount;
      }
      if (pointCount !== rootTile.pointCount) {
        throw new Error(
          `COPC benchmark progressive load returned ${pointCount} points; expected ${rootTile.pointCount}`
        );
      }
    }
  );
}

/** Format range-request counters for the benchmark display. */
function formatStats(stats: COPCBenchmarkStats): string {
  return `requests=${stats.requestCount}, bytes=${stats.requestedByteCount}`;
}
