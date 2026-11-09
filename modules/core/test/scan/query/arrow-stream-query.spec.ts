// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';
import {filterArrowTable} from '@loaders.gl/core/scan/arrow-execution';
import {queryArrowTableInBatches} from '../../../src/scan/query-arrow-table-in-batches';
import type {ArrowTableBatch} from '@loaders.gl/core/schema';

/** Creates a deterministic batch for streaming and identity checks. */
function makeBatch(values: (number | null)[]): ArrowTableBatch {
  const data = new arrow.Table({value: arrow.vectorFromArray(values, new arrow.Int32())});
  return {
    shape: 'arrow-table',
    data,
    schema: convertArrowToSchema(data.schema),
    batchType: 'data',
    length: data.numRows
  } as ArrowTableBatch;
}

const predicate = {op: '>' as const, args: [{property: 'value'}, 1] as const};

test('Arrow filter uses all-pass, all-reject, contiguous and scattered paths', () => {
  const source = makeBatch([1, 2, 3, null, 4]).data;
  const all = filterArrowTable(source, {op: 'isNull', args: [{property: 'value'}]});
  expect(all.numRows).toBe(1);
  const passing = filterArrowTable(source, {
    op: 'or',
    args: [
      predicate,
      {op: 'isNull', args: [{property: 'value'}]},
      {op: '=', args: [{property: 'value'}, 1]}
    ]
  });
  expect(passing.batches[0]).toBe(source.batches[0]);
  const rejected = filterArrowTable(source, {op: '>', args: [{property: 'value'}, 100]});
  expect(rejected.numRows).toBe(0);
  expect(rejected.schema).toBe(source.schema);
  const contiguous = filterArrowTable(source, predicate, {limit: 2});
  expect(contiguous.getChild('value')!.toArray()).toEqual(new Int32Array([2, 3]));
  expect(contiguous.getChild('value')!.data[0].values.buffer).toBe(
    source.getChild('value')!.data[0].values.buffer
  );
  const scattered = filterArrowTable(source, predicate);
  expect(scattered.toArray().map(row => row.value)).toEqual([2, 3, 4]);
  expect(() => filterArrowTable(source, predicate, {signal: AbortSignal.abort()})).toThrow();
});

test('stream query has global limits, aliases, pull backpressure and exact-boundary cleanup', async () => {
  let pulls = 0;
  let closed = false;
  async function* inputs() {
    try {
      pulls++;
      yield makeBatch([0, 2]);
      pulls++;
      yield makeBatch([3, 4]);
      pulls++;
      yield makeBatch([5]);
    } finally {
      closed = true;
    }
  }
  const iterator = queryArrowTableInBatches(inputs(), {
    predicate,
    select: [{column: 'value', as: 'number'}],
    limit: 3
  })[Symbol.asyncIterator]();
  expect(pulls).toBe(0);
  const first = await iterator.next();
  expect(pulls).toBe(1);
  expect(first.value!.data.toArray().map(row => row.number)).toEqual([2]);
  const second = await iterator.next();
  expect(second.value!.length).toBe(2);
  expect(pulls).toBe(2);
  expect((await iterator.next()).done).toBe(true);
  expect(pulls).toBe(2);
  expect(closed).toBe(true);
});

test('stream cancellation and consumer return close upstream without another pull', async () => {
  let closed = 0;
  async function* inputs() {
    try {
      yield makeBatch([2, 3]);
      yield makeBatch([4]);
    } finally {
      closed++;
    }
  }
  for await (const _batch of queryArrowTableInBatches(inputs(), {})) break;
  expect(closed).toBe(1);
  const controller = new AbortController();
  const iterator = queryArrowTableInBatches(inputs(), {signal: controller.signal})[
    Symbol.asyncIterator
  ]();
  await iterator.next();
  controller.abort();
  await expect(iterator.next()).rejects.toThrow();
  expect(closed).toBe(2);
});

test('record-batch filtering keeps a global limit and original schema and metadata', () => {
  const first = makeBatch([2, 0, 3]).data;
  const second = makeBatch([4, 5, 6]).data;
  const source = first.concat(second);
  source.batches[0].metadata.set('part', 'first');
  source.batches[1].metadata.set('part', 'second');
  const result = filterArrowTable(source, predicate, {limit: 3});
  expect(result.toArray().map(row => row.value)).toEqual([2, 3, 4]);
  expect(result.schema).toBe(source.schema);
  expect(result.batches.map(batch => batch.metadata.get('part'))).toEqual(['first', 'second']);
  expect(result.batches[1].data.children[0].values.buffer).toBe(
    second.batches[0].data.children[0].values.buffer
  );
});

test('zero limits avoid input work, empty results preserve schema, and reader errors propagate', async () => {
  let pulls = 0;
  let closed = false;
  async function* inputs() {
    try {
      pulls++;
      yield makeBatch([0, null]);
      throw new Error('reader failed');
    } finally {
      closed = true;
    }
  }
  for await (const _batch of queryArrowTableInBatches(inputs(), {limit: 0})) {
    throw new Error('zero limit yielded a batch');
  }
  expect(pulls).toBe(0);
  const iterator = queryArrowTableInBatches(inputs(), {predicate})[Symbol.asyncIterator]();
  const empty = await iterator.next();
  expect(empty.value!.length).toBe(0);
  expect(empty.value!.schema!.fields[0].name).toBe('value');
  await expect(iterator.next()).rejects.toThrow('reader failed');
  expect(closed).toBe(true);
});

test('portable mixed numeric bounds retain fractional and large bigint comparison semantics', () => {
  const source = new arrow.Table({value: arrow.vectorFromArray([1n, 2n, 3n], new arrow.Int64())});
  expect(
    filterArrowTable(source, {op: '>', args: [{property: 'value'}, 1.5]})
      .toArray()
      .map(row => row.value)
  ).toEqual([2n, 3n]);
  const large = new arrow.Table({
    value: arrow.vectorFromArray([9007199254740992n, 9007199254740993n], new arrow.Int64())
  });
  expect(
    filterArrowTable(large, {op: '>', args: [{property: 'value'}, 9007199254740992]})
      .toArray()
      .map(row => row.value)
  ).toEqual([9007199254740993n]);
  const fractional = new arrow.Table({
    value: arrow.vectorFromArray([1.5, 2, 2.5], new arrow.Float64())
  });
  expect(
    filterArrowTable(fractional, {op: '<', args: [{property: 'value'}, 2n]})
      .toArray()
      .map(row => row.value)
  ).toEqual([1.5]);
});

test('missing nested properties use SQL null semantics in the shared Arrow kernel', () => {
  const source = new arrow.Table({
    nested: arrow.vectorFromArray(
      [{value: 1}, null],
      new arrow.Struct([new arrow.Field('value', new arrow.Int32(), true)])
    )
  });
  const isNull = {op: 'isNull' as const, args: [{property: ['nested', 'missing']}] as const};
  expect(filterArrowTable(source, isNull).numRows).toBe(2);
  expect(filterArrowTable(source, {op: 'not', args: [isNull]}).numRows).toBe(0);
});

test('empty relational lists are absent while real relational operators are rejected', async () => {
  async function* inputs() {
    yield makeBatch([1, 2]);
  }
  const rows: number[] = [];
  for await (const batch of queryArrowTableInBatches(inputs(), {
    expressions: [],
    orderBy: [],
    groupBy: [],
    aggregates: [],
    union: []
  }))
    rows.push(...batch.data.toArray().map(row => row.value));
  expect(rows).toEqual([1, 2]);
  const iterator = queryArrowTableInBatches(inputs(), {orderBy: [{column: 'value'}]})[
    Symbol.asyncIterator
  ]();
  await expect(iterator.next()).rejects.toThrow('support only');
});
