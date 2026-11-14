// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getTransferList} from '@loaders.gl/core/worker-utils';
import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {
  deserializeParquetWorkerBatch,
  serializeParquetWorkerBatch,
  deserializeParquetWorkerResult,
  serializeParquetWorkerResult
} from '../../src/parquet/lib/parquet-worker-transport';

test('Parquet worker transport round-trips Arrow columns and rejects row serialization', () => {
  const table = arrow.tableFromArrays({value: [1, 2]});
  const serialized = serializeParquetWorkerResult(table) as any;
  const hydrated = deserializeParquetWorkerResult(serialized) as any;

  expect(
    deserializeParquetWorkerResult(serialized, {parquet: {shape: 'object-row-table'}})
  ).toMatchObject({shape: 'object-row-table', data: [{value: 1}, {value: 2}]});
  expect(serialized.columns.data.transport).toBe('arrow-js');
  expect(hydrated).toBeInstanceOf(arrow.Table);
  expect(hydrated.getChild('value')?.toArray()).toEqual(new Float64Array([1, 2]));

  const rows = {shape: 'object-row-table', data: [{value: 1}]} as any;
  expect(() => serializeParquetWorkerResult(rows)).toThrow('Arrow table output');
  expect(() => deserializeParquetWorkerResult(rows)).toThrow('Arrow column transport');
  expect(() => serializeParquetWorkerResult(null)).toThrow('Arrow table output');
});

test.each([
  'arrow',
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
  const batch = arrowTable.slice(0, 1).batches[0];
  batch.metadata.set('source', 'fixture');
  const serialized = serializeParquetWorkerBatch(batch, {parquet: {shape}}) as any;
  const transferred = structuredClone(serialized, {transfer: getTransferList(serialized)});
  const hydrated = deserializeParquetWorkerBatch(transferred);
  if (hydrated instanceof arrow.RecordBatch) {
    expect(hydrated.numRows).toBe(1);
    expect(hydrated.metadata.get('source')).toBe('fixture');
  } else {
    expect(hydrated).toMatchObject({shape: 'object-row-table', length: 1});
  }
  expect(bytes).toEqual(new Uint8Array([1, 2, 3, 4]));
  expect(arrowTable.getChild('value')?.get(3)).toBe(4);
  const row = hydrated instanceof arrow.RecordBatch ? hydrated.get(0)!.toJSON() : hydrated.data[0];
  expect(row.value).toBe(1);
  expect(Array.from(row.nested as Iterable<number>)).toEqual([1, 2]);
  expect((row.record as {label: string}).label).toBe('first');
});

test('Parquet batch hydration rejects decoded object-row payloads', () => {
  const batch = {shape: 'object-row-table', batchType: 'data', length: 1, data: [{value: 1}]};
  expect(() => deserializeParquetWorkerBatch(batch)).toThrow('Arrow column transport');
});
