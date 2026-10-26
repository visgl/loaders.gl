// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {
  deserializeParquetWorkerBatch,
  serializeParquetWorkerBatch,
  deserializeParquetWorkerResult,
  serializeParquetWorkerResult
} from '../../src/parquet/lib/parquet-worker-transport';

test('Parquet worker transport round-trips Arrow IPC and rejects row serialization', () => {
  const table = {shape: 'arrow-table', data: arrow.tableFromArrays({value: [1, 2]})} as const;
  const serialized = serializeParquetWorkerResult(table) as any;
  const hydrated = deserializeParquetWorkerResult(serialized) as any;

  expect(
    deserializeParquetWorkerResult(serialized, {parquet: {shape: 'object-row-table'}})
  ).toMatchObject({shape: 'object-row-table', data: [{value: 1}, {value: 2}]});
  expect(serialized.data.transport).toBe('arrow-ipc');
  expect(hydrated.data).toBeInstanceOf(arrow.Table);
  expect(hydrated.data.getChild('value')?.toArray()).toEqual(new Float64Array([1, 2]));

  const rows = {shape: 'object-row-table', data: [{value: 1}]} as any;
  expect(() => serializeParquetWorkerResult(rows)).toThrow('Arrow table output');
  expect(deserializeParquetWorkerResult(rows)).toBe(rows);
  expect(() => serializeParquetWorkerResult(null)).toThrow('Arrow table output');
});

test.each([
  'arrow-table',
  'object-row-table'
] as const)('Parquet %s batch transfer preserves nested values and retained parser buffers', shape => {
  const bytes = new Uint8Array([1, 2, 3, 4]);
  const arrowTable = new arrow.Table({
    value: arrow.vectorFromArray(bytes),
    nested: arrow.vectorFromArray(
      [[1, 2], [3], [], [4]],
      new arrow.List(new arrow.Field('item', new arrow.Int32(), true))
    ),
    record: arrow.vectorFromArray(
      [{label: 'first'}, {label: 'second'}, {label: 'third'}, {label: 'last'}],
      new arrow.Struct([new arrow.Field('label', new arrow.Utf8(), false)])
    )
  });
  const batch = {
    shape: 'arrow-table',
    batchType: 'data',
    length: 1,
    schema: {fields: [{name: 'value', type: 'uint8'}]},
    data: arrowTable.slice(0, 1)
  };
  const serialized = serializeParquetWorkerBatch(batch, {parquet: {shape}}) as any;
  const transferred = structuredClone(serialized, {transfer: [serialized.data.data.buffer]});
  const hydrated = deserializeParquetWorkerBatch(transferred);
  expect(hydrated).toMatchObject({batchType: 'data', length: 1, shape});
  expect(bytes).toEqual(new Uint8Array([1, 2, 3, 4]));
  expect(arrowTable.getChild('value')?.get(3)).toBe(4);
  const row = hydrated.shape === 'arrow-table' ? hydrated.data.get(0)!.toJSON() : hydrated.data[0];
  expect(row.value).toBe(1);
  expect(Array.from(row.nested as Iterable<number>)).toEqual([1, 2]);
  expect((row.record as {label: string}).label).toBe('first');
});

test('Parquet batch hydration keeps legacy object-row payloads usable', () => {
  const batch = {shape: 'object-row-table', batchType: 'data', length: 1, data: [{value: 1}]};
  expect(deserializeParquetWorkerBatch(batch)).toBe(batch);
});
