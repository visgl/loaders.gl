// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Float64, tableFromArrays, vectorFromArray} from 'apache-arrow';
import {
  queryScales,
  queryScalesInBatches,
  queryScaleExpressions,
  queryScalesProgressive
} from '@loaders.gl/core/scan-scales';
import {createScanQueryMetadata, type TableScanSource} from '@loaders.gl/core/loader-utils';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';
import {parseSQLQuery} from '@math.gl/sql/parser';

test('scale projections share the source query row set and expose the actual evaluator', async () => {
  const source = tableFromArrays({value: [0, 25, 100, 200, null]});
  const result = await queryScales(
    'SELECT value WHERE value >= 25 LIMIT 2',
    {
      radius: 'SCALE_LINEAR(value, DOMAIN(value), RANGE(2, 20))',
      color: "SCALE_COLOR(value, DOMAIN(value), PALETTE('viridis'))"
    },
    {source, sqlParser: parseSQLQuery}
  );
  expect(result.table.numRows).toBe(2);
  expect(result.columns.radius.toArray()).toEqual(new Float64Array([2, 20]));
  expect(result.scales.radius.descriptor.domain).toEqual([25, 100]);
  expect(result.scales.color.descriptor.domain).toEqual([25, 100]);
  const legendColor = result.scales.color.sample(100) as readonly number[];
  expect(result.columns.color.get(1)?.toArray()).toEqual(
    Uint8Array.from(legendColor, channel => Math.round(channel * 255))
  );
});

test('scale projection preserves null rows and handles empty fixed-domain queries', async () => {
  const source = tableFromArrays({value: [1, null]});
  const projections = {value: 'SCALE_LINEAR(value, DOMAIN(0, 10), RANGE(0, 1))'};
  const result = await queryScales({}, projections, {source});
  expect(result.columns.value.get(0)).toBeCloseTo(0.1);
  expect(result.columns.value.get(1)).toBeNull();
  const empty = await queryScales({limit: 0}, projections, {source});
  expect(empty.columns.value.length).toBe(0);
  expect(empty.scales.value.descriptor.domain).toEqual([0, 10]);
});

test('rejects unsupported scale SQL and missing input columns', async () => {
  const source = tableFromArrays({value: [1, 2]});
  await expect(queryScales({}, {value: 'value + 1'}, {source})).rejects.toThrow();
  await expect(
    queryScales({}, {value: 'SCALE_LINEAR(value, DOMAIN(missing), RANGE(0, 1))'}, {source})
  ).rejects.toThrow('Unknown scale domain column');
});

test('checks for cancellation before executing a scale query', async () => {
  const controller = new AbortController();
  controller.abort(new Error('cancelled scale query'));
  await expect(
    queryScales({}, {}, {source: tableFromArrays({value: [1]}), signal: controller.signal})
  ).rejects.toThrow('cancelled scale query');
});

/** Creates a counted scan over deterministic batches with identical schemas. */
function createScaleSource(first: readonly (number | null)[], second: readonly (number | null)[]) {
  const tables = [first, second].map(values =>
    tableFromArrays({value: vectorFromArray([...values], new Float64())})
  );
  const read = vi.fn(async function* () {
    for (const table of tables) yield* table.batches;
  });
  return {
    getQueryMetadata: async () =>
      createScanQueryMetadata({
        sourceType: 'test',
        queryType: 'table',
        schema: convertArrowToSchema(tables[0].schema),
        execution: {status: 'supported', method: 'read'},
        capabilities: {}
      }),
    read
  } satisfies TableScanSource;
}

test('fixed-domain streams append ordered batches using the same resolved scale', async () => {
  const source = createScaleSource([0, 5], [10, null]);
  const snapshots = await Array.fromAsync(
    queryScalesInBatches({}, {radius: 'SCALE_LINEAR(value, DOMAIN(0, 10), RANGE(0, 1))'}, {source})
  );
  expect(snapshots.map(result => Array.from(result.columns.radius))).toEqual([
    [0, 0.5],
    [1, null]
  ]);
  expect(snapshots[0].scales.radius).toBe(snapshots[1].scales.radius);
  expect(source.read).toHaveBeenCalledTimes(1);
});

test('progressive domains recolor retained rows and publish matching descriptors', async () => {
  const source = createScaleSource([1, 3], [9, null]);
  const snapshots = await Array.fromAsync(
    queryScalesProgressive(
      {},
      {radius: 'SCALE_LINEAR(value, DOMAIN(value), RANGE(0, 1))'},
      {source, emitEveryBatches: 1}
    )
  );
  expect(snapshots.map(snapshot => snapshot.final)).toEqual([false, false, true]);
  expect(snapshots[0].scales.radius.descriptor.domain).toEqual([1, 3]);
  expect(Array.from(snapshots[0].columns.radius)).toEqual([0, 1]);
  expect(snapshots[2].scales.radius.descriptor.domain).toEqual([1, 9]);
  expect(Array.from(snapshots[2].columns.radius)).toEqual([0, 0.25, 1, null]);
  expect(source.read).toHaveBeenCalledTimes(1);
});

test('progressive percentile endpoints are applied without rescanning the source', async () => {
  const source = createScaleSource([null], [0, 4, 8]);
  const snapshots = await Array.fromAsync(
    queryScalesProgressive(
      {},
      {radius: 'SCALE_LINEAR(value, DOMAIN_QUANTILE(value, 0.25, 0.75), RANGE(0, 1))'},
      {source, emitEveryBatches: 1}
    )
  );
  expect(snapshots.map(snapshot => snapshot.final)).toEqual([false, true]);
  expect(snapshots[1].scales.radius.descriptor.domain).toEqual([2, 6]);
  expect(snapshots[1].columns.radius.get(0)).toBeNull();
  expect(source.read).toHaveBeenCalledTimes(1);
});

test('progressive quantize publishes constant extents', async () => {
  const source = createScaleSource([5, 5], [15]);
  const snapshots = await Array.fromAsync(
    queryScalesProgressive(
      {},
      {color: "SCALE_QUANTIZE(value, 5, PALETTE('Blues'))"},
      {source, emitEveryBatches: 1}
    )
  );
  expect(snapshots.map(snapshot => snapshot.final)).toEqual([false, false, true]);
  expect(snapshots[0].scales.color.descriptor.thresholds).toEqual([5]);
  expect(snapshots[1].scales.color.descriptor.thresholds).toEqual([7, 9, 11, 13]);
  expect(snapshots[2].columns.color.length).toBe(3);
});

test('streaming validates its mode and resource limits', async () => {
  const source = createScaleSource([0, 1], [2, 3]);
  await expect(
    Array.fromAsync(
      queryScalesInBatches(
        {},
        {radius: 'SCALE_LINEAR(value, DOMAIN(value), RANGE(0, 1))'},
        {source}
      )
    )
  ).rejects.toThrow('require fixed domains');
  await expect(
    Array.fromAsync(queryScalesProgressive({}, {}, {source, emitEveryBatches: 0}))
  ).rejects.toThrow('positive integers');
  expect(source.read).not.toHaveBeenCalled();
  await expect(
    Array.fromAsync(queryScalesProgressive({}, {}, {source, maxRetainedRows: 1}))
  ).rejects.toThrow('retained row limit');
  await expect(
    Array.fromAsync(
      queryScalesProgressive(
        {limit: 0},
        {radius: 'SCALE_LINEAR(value, DOMAIN(value), RANGE(0, 1))'},
        {source}
      )
    )
  ).rejects.toThrow('could not resolve');
});

test.each([
  'value',
  'value * 2'
])('progressive quantile classifies %s using accumulated breaks', async expression => {
  const source = createScaleSource([0, 10, 20], [30, 40]);
  const snapshots = await Array.fromAsync(
    queryScalesProgressive(
      {},
      {color: `SCALE_QUANTILE(${expression}, 5, PALETTE('Blues'))`},
      {source, emitEveryBatches: 1}
    )
  );
  const final = snapshots.at(-1)!;
  expect(final.final).toBe(true);
  expect(final.scales.color.descriptor.thresholds).toEqual(
    expression === 'value' ? [8, 16, 24, 32] : [16, 32, 48, 64]
  );
  expect(final.columns.color.length).toBe(5);
  expect(source.read).toHaveBeenCalledTimes(1);
});

test('scale expressions compose CASE branches', async () => {
  const source = tableFromArrays({value: [0, 10], label: ['a', 'b']});
  const result = await queryScaleExpressions(
    {},
    {
      color:
        "CASE WHEN value = 0 THEN SCALE_COLOR(value, DOMAIN(0, 10), PALETTE('viridis')) ELSE SCALE_COLOR(value, DOMAIN(0, 10), PALETTE('Blues')) END"
    },
    {source}
  );
  expect(result.columns.color.length).toBe(2);
  expect(result.scales.color).toHaveLength(2);
  for (let row = 0; row < 2; row++) {
    const color = result.scales.color[row].sample(row * 10) as readonly number[];
    expect(result.columns.color.get(row)?.toArray()).toEqual(
      Uint8Array.from(color, channel => Math.round(channel * 255))
    );
  }
});

test('fixed ordinal and threshold mappings stream with explicit colors', async () => {
  const source = tableFromArrays({value: [0, 5, 10], category: ['low', 'high', 'unknown']});
  const results = await Array.fromAsync(
    queryScalesInBatches(
      {},
      {
        risk: "SCALE_THRESHOLD(value, ARRAY[5], PALETTE('#ffffff', '#000000'))",
        label: "SCALE_ORDINAL(category, CATEGORIES('low', 'high'), PALETTE('#ff0000', '#00ff00'))"
      },
      {source}
    )
  );
  expect(results).toHaveLength(1);
  const result = results[0];
  expect(result.scales.risk.descriptor.thresholds).toEqual([5]);
  expect(result.columns.risk.get(0)?.toArray()).toEqual(new Uint8Array([255, 255, 255, 255]));
  expect(result.columns.risk.get(1)?.toArray()).toEqual(new Uint8Array([0, 0, 0, 255]));
  expect(result.columns.label.get(0)?.toArray()).toEqual(new Uint8Array([255, 0, 0, 255]));
  expect(result.columns.label.get(2)).toBeNull();
});

test('parameterized scale input queries preserve upstream binding semantics', async () => {
  const source = tableFromArrays({value: [1, 2, 3]});
  const result = await queryScales(
    'SELECT value WHERE value >= :minimum',
    {
      size: 'SCALE_LINEAR(value, DOMAIN(value), RANGE(0, 1))'
    },
    {source, sqlParser: sql => parseSQLQuery(sql, {parameters: {minimum: 2}})}
  );
  expect(Array.from(result.columns.size)).toEqual([0, 1]);
  expect(result.scales.size.descriptor.domain).toEqual([2, 3]);
});
