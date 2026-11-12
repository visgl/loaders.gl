// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {queryProgressive} from '@loaders.gl/core/scan';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';
import {createScanQueryMetadata} from '@loaders.gl/core/loader-utils';
import type {TableScanSource} from '@loaders.gl/core/loader-utils';

/** Keeps the source split into two genuinely independent Arrow batches. */
function makeSource(): TableScanSource {
  const first = new arrow.Table({
    country: arrow.vectorFromArray(['SE', 'US', 'SE'], new arrow.Utf8()),
    temperature: arrow.vectorFromArray([10, 20, null], new arrow.Float64())
  });
  const second = new arrow.Table({
    country: arrow.vectorFromArray(['US', 'SE'], new arrow.Utf8()),
    temperature: arrow.vectorFromArray([30, 50], new arrow.Float64())
  });
  const schema = convertArrowToSchema(first.schema);
  return {
    getQueryMetadata: async () =>
      createScanQueryMetadata({
        sourceType: 'test',
        queryType: 'table',
        schema,
        execution: {status: 'supported', method: 'read'},
        capabilities: {}
      }),
    read: async function* () {
      for (const data of [first, second]) {
        yield {shape: 'arrow-table' as const, schema, data, length: data.numRows, batchType: 'data' as const};
      }
    }
  };
}

test('progressive GROUP BY yields complete replacement tables and a final snapshot', async () => {
  const snapshots = [];
  for await (const snapshot of queryProgressive(
    {
      groupBy: 'country',
      aggregates: [
        {function: 'count', as: 'rows'},
        {function: 'count', column: 'temperature', as: 'valid'},
        {function: 'sum', column: 'temperature', as: 'sum'},
        {function: 'avg', column: 'temperature', as: 'mean'},
        {function: 'min', column: 'temperature', as: 'min'},
        {function: 'max', column: 'temperature', as: 'max'}
      ]
    },
    {source: makeSource()}
  )) {
    snapshots.push({
      final: snapshot.final,
      rowsProcessed: snapshot.rowsProcessed,
      rows: snapshot.table.data.toArray().map(row => row.toJSON())
    });
  }
  expect(snapshots).toEqual([
    {
      final: false, rowsProcessed: 3,
      rows: [
        {country: 'SE', rows: 2, valid: 1, sum: 10, mean: 10, min: 10, max: 10},
        {country: 'US', rows: 1, valid: 1, sum: 20, mean: 20, min: 20, max: 20}
      ]
    },
    {
      final: false, rowsProcessed: 5,
      rows: [
        {country: 'SE', rows: 3, valid: 2, sum: 60, mean: 30, min: 10, max: 50},
        {country: 'US', rows: 2, valid: 2, sum: 50, mean: 25, min: 20, max: 30}
      ]
    },
    {
      final: true, rowsProcessed: 5,
      rows: [
        {country: 'SE', rows: 3, valid: 2, sum: 60, mean: 30, min: 10, max: 50},
        {country: 'US', rows: 2, valid: 2, sum: 50, mean: 25, min: 20, max: 30}
      ]
    }
  ]);
});

test('global aggregates update without storing rows and honor WHERE', async () => {
  const snapshots = [];
  for await (const snapshot of queryProgressive(
    {
      where: {op: '>', args: [{property: 'temperature'}, 15]},
      aggregates: [{function: 'count', as: 'count'}, {function: 'avg', column: 'temperature', as: 'avg'}]
    },
    {source: makeSource(), emitEveryBatches: 2}
  )) {
    snapshots.push(snapshot);
  }
  expect(snapshots).toHaveLength(2);
  expect(snapshots[0].final).toBe(false);
  expect(snapshots[0].rowsProcessed).toBe(3);
  expect(snapshots[0].table.data.toArray()[0].toJSON()).toEqual({count: 3, avg: 100 / 3});
  expect(snapshots[1].final).toBe(true);
});

test('early return closes source iterator without reading remaining batches', async () => {
  const first = new arrow.Table({
    n: arrow.vectorFromArray([1], new arrow.Int32())
  });
  const schema = convertArrowToSchema(first.schema);
  let pulls = 0;
  let closed = false;
  const source: TableScanSource = {
    getQueryMetadata: async () =>
      createScanQueryMetadata({
        sourceType: 'test',
        queryType: 'table',
        schema,
        execution: {status: 'supported', method: 'read'},
        capabilities: {}
      }),
    read: async function* () {
      try {
        for (let i = 0; i < 5; i++) {
          pulls++;
          yield {shape: 'arrow-table', data: first, schema, length: 1, batchType: 'data'};
        }
      } finally {
        closed = true;
      }
    }
  };
  for await (const snapshot of queryProgressive(
    {aggregates: [{function: 'count', as: 'count'}]},
    {source}
  )) {
    expect(snapshot.final).toBe(false);
    break;
  }
  expect(pulls).toBe(1);
  expect(closed).toBe(true);
});

test('empty global input emits a final zero count, not a provisional result', async () => {
  const data = new arrow.Table({
    n: arrow.vectorFromArray([], new arrow.Int32())
  });
  const source = {shape: 'arrow-table' as const, data, schema: convertArrowToSchema(data.schema)};
  const snapshots = [];
  for await (const snapshot of queryProgressive(
    {aggregates: [{function: 'count', as: 'count'}, {function: 'sum', column: 'n', as: 'sum'}]},
    {source}
  )) snapshots.push(snapshot);
  expect(snapshots).toHaveLength(1);
  expect(snapshots[0].final).toBe(true);
  expect(snapshots[0].table.data.toArray()[0].toJSON()).toEqual({count: 0, sum: null});
});

test('invalid progressive requests reject before reading', async () => {
  const source = makeSource();
  const requests = [
    {aggregates: []},
    {aggregates: [{function: 'median', column: 'temperature', as: 'median'}]},
    {aggregates: [{function: 'sum', as: 'sum'}]},
    {groupBy: 'country', aggregates: [{function: 'count', as: 'country'}]}
  ];
  for (const request of requests) {
    await expect((async () => {
      for await (const _snapshot of queryProgressive(request as never, {source})) {}
    })()).rejects.toThrow();
  }
  await expect((async () => {
    for await (const _snapshot of queryProgressive(
      {aggregates: [{function: 'count', as: 'count'}]},
      {source, emitEveryBatches: 0}
    )) {}
  })()).rejects.toThrow('emitEveryBatches');
});
