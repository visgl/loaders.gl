// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterAll, beforeAll, expect, test} from 'vitest';
import type {TableQuery} from '@loaders.gl/core/scan';
import {
  queryScales,
  queryScalesInBatches,
  queryScalesProgressive
} from '@loaders.gl/core/scan-scales';
import {createScaleQuerySources} from './scale-query-fixtures';

let sources: Awaited<ReturnType<typeof createScaleQuerySources>>;

beforeAll(async () => {
  sources = await createScaleQuerySources(128, 16);
});

afterAll(async () => {
  await sources?.parquet.close();
});

const input: TableQuery = {
  select: ['id', 'value'],
  where: {op: '>=', args: [{property: 'id'}, 64]},
  offset: 4,
  limit: 16
};

test.each([
  'arrow',
  'csv',
  'parquet'
] as const)('%s scale projection honors row selection, nulls, and streamed order', async format => {
  const source = sources[format];
  const fixed = {value: 'SCALE_LINEAR(value, DOMAIN(0, 127), RANGE(0, 127))'};
  const result = await queryScales(input, fixed, {source});
  const streamed = await Array.fromAsync(queryScalesInBatches(input, fixed, {source}));
  const expected = Array.from({length: 16}, (_, index) => index + 68);
  expect([...result.table.getChild('id')!]).toEqual(expected);
  expect(streamed.flatMap(batch => Array.from(batch.columns.value))).toEqual(
    Array.from(result.columns.value)
  );
  expect(result.columns.value.get(1)).toBeNull();
  expect(result.columns.value.get(2)).toBeCloseTo(70);
});

test('progressive percentile results are stable across equivalent chunked sources', async () => {
  const projections = {
    color: "SCALE_COLOR(value, DOMAIN_QUANTILE(value, 0.25, 0.75), PALETTE('viridis'))"
  };
  const prunedBefore = sources.parquet.getTelemetry().rowGroupsPrunedByStatistics;
  const results = await Promise.all(
    Object.values(sources).map(async source => {
      const snapshots = await Array.fromAsync(
        queryScalesProgressive(input, projections, {source, emitEveryBatches: 1})
      );
      return snapshots.at(-1)!;
    })
  );
  for (const result of results) {
    expect(result.final).toBe(true);
    expect(result.table.numRows).toBe(16);
    expect(result.scales.color.descriptor.domain).toEqual([72.5, 79.5]);
    expect(result.columns.color.get(1)).toBeNull();
    expect(Array.from(result.columns.color).map(tuple => tuple?.toArray())).toEqual(
      Array.from(results[0].columns.color).map(tuple => tuple?.toArray())
    );
  }
  expect(sources.parquet.getTelemetry().rowGroupsPrunedByStatistics).toBeGreaterThan(prunedBefore);
});

test('aborts the underlying scan between append-only batches', async () => {
  const controller = new AbortController();
  const iterator = queryScalesInBatches(
    {},
    {value: 'SCALE_LINEAR(value, DOMAIN(0, 127), RANGE(0, 127))'},
    {source: sources.arrow, signal: controller.signal}
  )[Symbol.asyncIterator]();
  expect((await iterator.next()).value?.table.numRows).toBeGreaterThan(0);
  controller.abort(new Error('cancel cross-format query'));
  await expect(iterator.next()).rejects.toThrow('cancel cross-format query');
});
