// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {
  deserializeParquetWorkerResult,
  serializeParquetWorkerResult
} from '../src/lib/parquet-worker-transport';

test('Parquet worker transport round-trips Arrow IPC and preserves row tables', () => {
  const table = {shape: 'arrow-table', data: arrow.tableFromArrays({value: [1, 2]})} as const;
  const serialized = serializeParquetWorkerResult(table) as any;
  const hydrated = deserializeParquetWorkerResult(serialized) as any;

  expect(serialized.data.transport).toBe('arrow-ipc');
  expect(hydrated.data).toBeInstanceOf(arrow.Table);
  expect(hydrated.data.getChild('value')?.toArray()).toEqual(new Float64Array([1, 2]));

  const rows = {shape: 'object-row-table', data: [{value: 1}]} as any;
  expect(serializeParquetWorkerResult(rows)).toBe(rows);
  expect(deserializeParquetWorkerResult(rows)).toBe(rows);
  expect(serializeParquetWorkerResult(null)).toBeNull();
});
