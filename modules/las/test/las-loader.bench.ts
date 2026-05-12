// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile, parse, parseInBatches} from '@loaders.gl/core';
import {LASLoader} from '@loaders.gl/las';
import type {LASLoaderOptions} from '@loaders.gl/las';

const LAS_BINARY_URL = '@loaders.gl/las/test/data/indoor.laz';
const OUTPUT_POINT_SKIP = 10;
const BATCH_SIZE = 25_000;
const LAS_BACKENDS: NonNullable<NonNullable<LASLoaderOptions['las']>['backend']>[] = [
  'laz-perf',
  'copc',
  'laz-rs'
];

/**
 * Adds LAS backend parse benchmarks.
 * @param bench Benchmark suite
 * @returns Benchmark suite with LAS cases added
 */
export default async function lasLoaderBench(bench) {
  const response = await fetchFile(LAS_BINARY_URL);
  const arrayBuffer = await response.arrayBuffer();
  const pointCount = getOutputPointCount(arrayBuffer, OUTPUT_POINT_SKIP);
  const benchmarkOptions = {multiplier: pointCount, unit: 'output points', minIterations: 3};

  bench.group('LASLoader Backends');

  for (const backend of LAS_BACKENDS) {
    bench.addAsync(`parse arrow-table backend=${backend}`, benchmarkOptions, async () => {
      await parse(arrayBuffer.slice(0), LASLoader, {
        core: {worker: false},
        las: {backend, shape: 'arrow-table', skip: OUTPUT_POINT_SKIP}
      });
    });

    bench.addAsync(`parseInBatches arrow-table backend=${backend}`, benchmarkOptions, async () => {
      const batches = await parseInBatches([arrayBuffer.slice(0)], LASLoader, {
        batchSize: BATCH_SIZE,
        core: {worker: false},
        las: {backend, shape: 'arrow-table', skip: OUTPUT_POINT_SKIP}
      });
      for await (const _batch of batches) {
        _batch;
      }
    });
  }

  return bench;
}

/**
 * Gets the number of LAS points emitted after applying a skip option.
 * @param arrayBuffer LAS/LAZ file data
 * @param skip Point skip factor
 * @returns Number of output points
 */
function getOutputPointCount(arrayBuffer: ArrayBuffer, skip: number): number {
  return Math.ceil(getLASPointCount(arrayBuffer) / Math.max(1, skip));
}

/**
 * Gets the LAS point count from the file header.
 * @param arrayBuffer LAS/LAZ file data
 * @returns Source point count
 */
function getLASPointCount(arrayBuffer: ArrayBuffer): number {
  const dataView = new DataView(arrayBuffer);
  const majorVersion = dataView.getUint8(24);
  const minorVersion = dataView.getUint8(25);
  if (majorVersion === 1 && minorVersion >= 4) {
    return Number(dataView.getBigUint64(247, true));
  }
  return dataView.getUint32(107, true);
}
