// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import * as arrow from 'apache-arrow';
import {parseSQLQuery} from '@math.gl/expressions/sql';
import {query, queryInBatches, createQueryMetadata} from '@loaders.gl/core/query';
import {query as legacyQuery} from '@loaders.gl/core/scan';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';
import {executeTableScanBatches, makeTableScanBatch} from '@loaders.gl/core/loader-utils';
import type {
  TableQueryCapabilities,
  TableQuerySource,
  TableQueryReadOptions
} from '@loaders.gl/core/query';
import type {ArrowTable} from '@loaders.gl/core/schema';

/** Small nullable table used for exact pushdown and fallback comparisons. */
function makeTable(): ArrowTable {
  const data = new arrow.Table({value: arrow.vectorFromArray([1, null, 3, 4], new arrow.Int32())});
  return {shape: 'arrow-table', data, schema: convertArrowToSchema(data.schema)};
}

/** Source fixture that executes simple physical operations with the shared executor. */
function makeSource(capabilities: Partial<TableQueryCapabilities> = {}) {
  const table = makeTable();
  const metadata = createQueryMetadata({
    sourceType: 'test',
    queryType: 'table',
    schema: table.schema!,
    execution: {status: 'supported', method: 'read'},
    queryCapabilities: {
      table: {
        projection: 'pushdown',
        predicate: 'pushdown',
        cast: 'pushdown',
        offset: 'pushdown',
        limit: 'pushdown',
        expressions: 'pushdown',
        streaming: true,
        cancellation: true,
        ...capabilities
      }
    }
  });
  const read = vi.fn((options?: TableQueryReadOptions) =>
    executeTableScanBatches(async function* () {
      yield makeTableScanBatch(table);
    }, options)
  );
  const source: TableQuerySource = {getQueryMetadata: async () => metadata, read};
  return {source, read, table, metadata};
}

test('query aliases share implementation and metadata capability identity', () => {
  const {metadata} = makeSource();
  expect(query).toBe(legacyQuery);
  expect(metadata.queryCapabilities).toBe(metadata.capabilities);
  expect(Object.isFrozen(metadata.queryCapabilities)).toBe(true);
});

test.each([
  'pushdown',
  'residual',
  undefined
] as const)('offset %s is applied exactly once', async offset => {
  const {source, read} = makeSource({offset});
  const result = await query({offset: 2, limit: 1}, {source});
  expect(result.data.getChild('value')!.toArray()).toEqual(new Int32Array([3]));
  expect(read.mock.calls[0][0]).toMatchObject(
    offset === 'pushdown' ? {offset: 2, limit: 1} : {limit: 3}
  );
  if (offset !== 'pushdown') expect(read.mock.calls[0][0]?.offset).toBeUndefined();
});

test('residual filtering prevents premature offset and limit pushdown', async () => {
  const {source, read} = makeSource({predicate: 'residual'});
  const result = await query(
    {where: {op: '>', args: [{property: 'value'}, 1]}, offset: 1, limit: 1},
    {source}
  );
  expect(result.data.getChild('value')!.get(0)).toBe(4);
  expect(read.mock.calls[0][0]?.offset).toBeUndefined();
  expect(read.mock.calls[0][0]?.limit).toBeUndefined();
});

test('CAST projection and filtering use an accepted exact source plan without a second offset', async () => {
  const {source, read, table} = makeSource();
  const logical = parseSQLQuery(
    'SELECT CAST(value AS BIGINT) AS result WHERE CAST(value AS BIGINT) >= 3 OFFSET 1 LIMIT 1'
  );
  const expected = await query(logical, {source: table});
  const execute = vi.fn(async function* () {
    yield makeTableScanBatch(expected);
  });
  source.planQueryPushdown = vi.fn(async () => ({schema: expected.schema!, read: execute}));
  const result = await query(logical, {source});
  expect(result.data.getChild('result')!.get(0)).toBe(4n);
  expect(source.planQueryPushdown).toHaveBeenCalledTimes(1);
  expect(execute).toHaveBeenCalledTimes(1);
  expect(read).not.toHaveBeenCalled();
});

test.each([
  true,
  false
])('CAST falls back when capability or exact plan declines: %s', async supportsCast => {
  const {source, read} = makeSource({cast: supportsCast ? 'pushdown' : 'residual'});
  source.planQueryPushdown = vi.fn(async () => null);
  const result = await query(
    'SELECT CAST(value AS BIGINT) AS result WHERE CAST(value AS BIGINT) >= 3 OFFSET 1 LIMIT 1',
    {source, sqlParser: parseSQLQuery}
  );
  expect(result.data.getChild('result')!.get(0)).toBe(4n);
  expect(source.planQueryPushdown).toHaveBeenCalledTimes(supportsCast ? 1 : 0);
  expect(read.mock.calls[0][0]?.limit).toBeUndefined();
  expect(read.mock.calls[0][0]?.offset).toBeUndefined();
});

test('accepted plans preserve zero-limit schemas without executing the source', async () => {
  const {source, table} = makeSource();
  const expected = await query({limit: 0}, {source: table});
  const execute = vi.fn(async function* () {
    throw new Error('must not execute');
  });
  source.planQueryPushdown = async () => ({schema: expected.schema!, read: execute});
  const result = await query({limit: 0}, {source});
  expect(result.data.numRows).toBe(0);
  expect(result.data.schema.names).toEqual(['value']);
  expect(execute).not.toHaveBeenCalled();
});

test('accepted plans reject schema drift and excess rows', async () => {
  const {source, table} = makeSource();
  source.planQueryPushdown = async () => ({
    schema: {fields: [], metadata: {}},
    read: async function* () {}
  });
  await expect(query({}, {source})).rejects.toThrow('pushdown schema');
  source.planQueryPushdown = async () => ({
    schema: table.schema!,
    read: async function* () {
      yield makeTableScanBatch(table);
    }
  });
  await expect(query({limit: 1}, {source})).rejects.toThrow('more rows');
});

test('consumer return closes accepted plan iterators and reports completion once', async () => {
  const {source, table} = makeSource();
  const closed = vi.fn();
  const onQueryComplete = vi.fn();
  source.planQueryPushdown = async () => ({
    schema: table.schema!,
    read: async function* () {
      try {
        yield makeTableScanBatch(table);
        yield makeTableScanBatch(table);
      } finally {
        closed();
      }
    }
  });
  for await (const batch of queryInBatches({}, {source, onQueryComplete})) {
    expect(batch.length).toBe(4);
    break;
  }
  expect(closed).toHaveBeenCalledOnce();
  expect(onQueryComplete).toHaveBeenCalledOnce();
  expect(onQueryComplete.mock.calls[0][0].status).toBe('early-terminated');
});

test('offset without limit and unsafe combined windows preserve semantics', async () => {
  const native = makeSource();
  expect((await query({offset: 3}, {source: native.source})).data.getChild('value')!.get(0)).toBe(
    4
  );
  expect(native.read.mock.calls[0][0]?.offset).toBe(3);
  const residual = makeSource({offset: undefined});
  expect(
    (await query({offset: Number.MAX_SAFE_INTEGER, limit: 1}, {source: residual.source})).data
      .numRows
  ).toBe(0);
  expect(residual.read.mock.calls[0][0]?.limit).toBeUndefined();
});

test('CAST-only projection does not require general expression pushdown', async () => {
  const {source, table, read} = makeSource({expressions: 'unsupported'});
  const logical = parseSQLQuery('SELECT CAST(value AS BIGINT) AS result');
  const expected = await query(logical, {source: table});
  source.planQueryPushdown = vi.fn(async () => ({
    schema: expected.schema!,
    read: async function* () {
      yield makeTableScanBatch(expected);
    }
  }));
  const result = await query(logical, {source});
  expect(result.data.getChild('result')!.get(1)).toBeNull();
  expect(source.planQueryPushdown).toHaveBeenCalledOnce();
  expect(read).not.toHaveBeenCalled();
});

test('unhandled arithmetic never reaches the full-query planning hook', async () => {
  const {source} = makeSource({expressions: 'unsupported'});
  source.planQueryPushdown = vi.fn(async () => null);
  expect(
    (await query('SELECT value + 1 AS result', {source, sqlParser: parseSQLQuery})).data
      .getChild('result')!
      .get(0)
  ).toBe(2);
  expect(source.planQueryPushdown).not.toHaveBeenCalled();
});

test('cancellation during planning prevents physical execution', async () => {
  const {source, table, read} = makeSource();
  const controller = new AbortController();
  const execute = vi.fn(async function* () {
    yield makeTableScanBatch(table);
  });
  source.planQueryPushdown = async () => {
    controller.abort(new Error('cancel plan'));
    return {schema: table.schema!, read: execute};
  };
  const onQueryComplete = vi.fn();
  await expect(query({}, {source, signal: controller.signal, onQueryComplete})).rejects.toThrow(
    'cancel plan'
  );
  expect(execute).not.toHaveBeenCalled();
  expect(read).not.toHaveBeenCalled();
  expect(onQueryComplete.mock.calls[0][0].status).toBe('cancelled');
});

test('cancellation closes a running physical plan', async () => {
  const {source, table} = makeSource();
  const controller = new AbortController();
  const closed = vi.fn();
  const onQueryComplete = vi.fn();
  source.planQueryPushdown = async () => ({
    schema: table.schema!,
    read: async function* () {
      try {
        yield makeTableScanBatch(table);
        controller.abort(new Error('cancel read'));
        yield makeTableScanBatch(table);
      } finally {
        closed();
      }
    }
  });
  await expect(query({}, {source, signal: controller.signal, onQueryComplete})).rejects.toThrow(
    'cancel read'
  );
  expect(closed).toHaveBeenCalledOnce();
  expect(onQueryComplete).toHaveBeenCalledOnce();
  expect(onQueryComplete.mock.calls[0][0].status).toBe('cancelled');
});

test('accepted empty plans preserve schema and reject batch schema drift', async () => {
  const {source, table} = makeSource();
  source.planQueryPushdown = async () => ({schema: table.schema!, read: async function* () {}});
  expect((await query({}, {source})).data.schema.names).toEqual(['value']);
  const otherData = new arrow.Table({value: arrow.vectorFromArray(['a'], new arrow.Utf8())});
  source.planQueryPushdown = async () => ({
    schema: table.schema!,
    read: async function* () {
      yield makeTableScanBatch({
        shape: 'arrow-table',
        data: otherData,
        schema: convertArrowToSchema(otherData.schema)
      });
    }
  });
  await expect(query({}, {source})).rejects.toThrow('pushdown batch schema');
});

test.each([
  true,
  false
])('an external adapter can accept or decline a rewritten mixed projection (%s)', async accept => {
  const {source, table, read} = makeSource({expressions: 'unsupported'});
  source.supportsQueryProjectionPushdown = selection =>
    typeof selection === 'object' &&
    'expression' in selection &&
    selection.expression.type === 'CallExpression';
  const plan = vi.fn<NonNullable<TableQuerySource['planQueryPushdown']>>(
    async (request, options) => {
      if (!accept) return null;
      const empty = await query({...request, limit: 0}, {source: table, signal: options?.signal});
      return {
        schema: empty.schema!,
        async *read(options) {
          yield makeTableScanBatch(await query(request, {source: table, signal: options?.signal}));
        }
      };
    }
  );
  source.planQueryPushdown = plan;
  const request = parseSQLQuery(
    'SELECT CAST(value AS BIGINT) AS wide, value + 1 AS next LIMIT 1 OFFSET 2'
  );
  const result = await query(request, {source});
  const expected = await query(request, {source: table});
  expect(result.data.toArray().map(row => row.toJSON())).toEqual(
    expected.data.toArray().map(row => row.toJSON())
  );
  expect(plan).toHaveBeenCalledOnce();
  expect(plan.mock.calls[0][0]).toMatchObject({
    select: ['value', {expression: {type: 'CallExpression'}}],
    limit: 1,
    offset: 2
  });
  if (accept) expect(read).not.toHaveBeenCalled();
  else expect(read).toHaveBeenCalledOnce();
});
