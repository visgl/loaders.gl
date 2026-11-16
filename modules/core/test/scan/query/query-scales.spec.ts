// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {tableFromArrays} from 'apache-arrow';
import {queryScales} from '@loaders.gl/core/scan-scales';
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
