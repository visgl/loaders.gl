// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Table, tableFromArrays} from 'apache-arrow';
import {queryScalesProgressive} from '@loaders.gl/core/scan-scales';

test('bounded percentile domains stay stable across Arrow chunk boundaries', async () => {
  const rowCount = 65_536;
  const table = tableFromArrays({
    value: Float64Array.from({length: rowCount}, (_, row) => (row * 37) % rowCount)
  });
  const projections = {
    value: 'SCALE_LINEAR(value, DOMAIN_QUANTILE(value, 0.1, 0.9), RANGE(0, 1))'
  };
  const results = await Promise.all(
    [1024, 4093].map(async batchSize => {
      const batches = [];
      for (let row = 0; row < rowCount; row += batchSize) {
        batches.push(...table.slice(row, row + batchSize).batches);
      }
      const source = new Table(table.schema, batches);
      for await (const result of queryScalesProgressive({}, projections, {
        source,
        emitEveryBatches: rowCount,
        quantileCapacity: 128
      })) {
        if (result.final) {
          expect(result.columns.value.length).toBe(rowCount);
          return result.scales.value.descriptor.domain as readonly number[];
        }
      }
      throw new Error('Scale stream did not emit a final snapshot');
    })
  );
  expect(results[0]).toEqual(results[1]);
  expect(Math.abs(results[0][0] / (rowCount - 1) - 0.1)).toBeLessThan(0.04);
  expect(Math.abs(results[0][1] / (rowCount - 1) - 0.9)).toBeLessThan(0.04);
});
