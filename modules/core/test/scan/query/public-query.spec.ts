// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import * as arrow from 'apache-arrow';
import {query, queryInBatches, type QueryOptions} from '@loaders.gl/core/query';
import {ST_MAKEPOINT} from '@math.gl/geospatial/st-functions';
import {parseSQLQuery} from '@math.gl/sql/parser';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';
import {createScanQueryMetadata} from '@loaders.gl/core/loader-utils';
import type {TableBatch} from '@loaders.gl/core/schema';
import type {TableScanSource, TableScanReadOptions} from '@loaders.gl/core/loader-utils';

/** Creates a small source table with a predicate-only column. */
function makeTable(): arrow.Table {
  const data = new arrow.Table({
    name: arrow.vectorFromArray(['a', 'b', 'c'], new arrow.Utf8()),
    value: arrow.vectorFromArray([1, 2, 3], new arrow.Int32())
  });
  return data;
}

const logical = {
  select: [{column: 'name', as: 'label'}],
  where: {op: '>', args: [{property: 'value'}, 1] as const},
  limit: 1
} as const;

test('collected and streamed queries agree and report one completion', async () => {
  const source = makeTable();
  const onQueryComplete = vi.fn();
  const result = await query(logical, {source, onQueryComplete});
  expect(result.toArray().map(row => row.toJSON())).toEqual([{label: 'b'}]);
  expect(onQueryComplete).toHaveBeenCalledTimes(1);
  expect(onQueryComplete.mock.calls[0][0]).toMatchObject({
    status: 'early-terminated',
    rowsReturned: 1
  });
  const rows: unknown[] = [];
  for await (const batch of queryInBatches(logical, {source}))
    rows.push(...[...batch].map(row => row.toJSON()));
  expect(rows).toEqual([{label: 'b'}]);
  const projected = await query({select: [{column: 'name', as: 'label'}]}, {source});
  expect(projected.getChild('label')!.data[0].values.buffer).toBe(
    source.getChild('name')!.data[0].values.buffer
  );
});

test.each([
  {offset: 1},
  {limit: 0},
  {_scan: {offset: 1}},
  {_scan: {limit: 0}}
])('rejects row windows outside the logical query: %j', async window => {
  const onQueryComplete = vi.fn();
  const options = {source: makeTable(), onQueryComplete, ...window} as unknown as QueryOptions;
  await expect(query({}, options)).rejects.toThrow('Put offset and limit in the logical query');
  expect(onQueryComplete).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({status: 'failed', sourcesRead: 0})
  );
});

test('empty and zero-limit results preserve aliased schemas without reading source data', async () => {
  const table = makeTable();
  const read = vi.fn(async function* () {
    throw new Error('must not read');
  });
  const source: TableScanSource = {
    getQueryMetadata: async () =>
      createScanQueryMetadata({
        sourceType: 'test',
        queryType: 'table',
        schema: convertArrowToSchema(table.schema),
        execution: {status: 'supported', method: 'read'},
        capabilities: {}
      }),
    read
  };
  const result = await query({select: [{column: 'name', as: 'label'}], limit: 0}, {source});
  expect(result.numRows).toBe(0);
  expect(result.schema.fields.map(field => field.name)).toEqual(['label']);
  expect(read).not.toHaveBeenCalled();
  const rejected = await query(
    {select: ['name'], where: {op: '>', args: [{property: 'value'}, 100]}},
    {source: table}
  );
  expect(rejected.numRows).toBe(0);
  expect(rejected.schema.fields[0].name).toBe('name');
});

test.each([
  'residual',
  'pushdown+residual'
] as const)('sources use %s filtering exactly once', async support => {
  const table = makeTable();
  let received: TableScanReadOptions | undefined;
  const source: TableScanSource = {
    getQueryMetadata: async () =>
      createScanQueryMetadata({
        sourceType: 'test',
        queryType: 'table',
        schema: convertArrowToSchema(table.schema),
        execution: {status: 'supported', method: 'read'},
        capabilities: {
          table: {
            projection: 'pushdown',
            predicate: support,
            limit: 'pushdown',
            streaming: true,
            cancellation: true
          }
        }
      }),
    read: async function* (options) {
      received = options;
      const data = support === 'residual' ? table : table.slice(1, 1 + (options?.limit ?? 2));
      yield* data.batches;
    }
  };
  const result = await query(logical, {source});
  expect(result.toArray().map(row => row.label)).toEqual(['b']);
  expect(received!.columns).toEqual(['name', 'value']);
  expect(received!.onQueryComplete).toBeUndefined();
  expect(received!.predicate).toEqual(support === 'residual' ? undefined : logical.where);
  expect(received!.limit).toBe(support === 'residual' ? undefined : 1);

  const page = await query({...logical, offset: 1}, {source});
  expect(page.toArray().map(row => row.label)).toEqual(['c']);
  expect(received!.limit).toBe(support === 'residual' ? undefined : 2);
});

test('computed SQL aligns projected source fields and keeps the limit above local filtering', async () => {
  const table = makeTable();
  const read = vi.fn(async function* (_options: TableScanReadOptions = {}) {
    const data = new arrow.Table({
      value: table.getChild('value')!,
      extra: arrow.vectorFromArray([8, 9, 10], new arrow.Int32()),
      name: table.getChild('name')!
    });
    yield* data.batches;
  });
  const source: TableScanSource = {
    getQueryMetadata: async () =>
      createScanQueryMetadata({
        sourceType: 'test',
        queryType: 'table',
        schema: convertArrowToSchema(table.schema),
        execution: {status: 'supported', method: 'read'},
        capabilities: {
          table: {
            projection: 'pushdown',
            predicate: 'pushdown',
            limit: 'pushdown',
            streaming: true,
            cancellation: true
          }
        }
      }),
    read
  };
  const result = await query('SELECT name, value * 10 AS score WHERE value + 1 > 2 LIMIT 1', {
    source,
    sqlParser: parseSQLQuery
  });
  expect(result.getChild('name')!.toArray()).toEqual(['b']);
  expect(Array.from(result.getChild('score')!.toArray())).toEqual([20]);
  expect(read).toHaveBeenCalledWith(expect.objectContaining({columns: ['name', 'value']}));
  const [options] = read.mock.calls[0]!;
  expect(options?.limit).toBeUndefined();
  expect(options?.predicate).toBeUndefined();
});

test('row batches normalize to Arrow and failures/cancellation complete once', async () => {
  const table = makeTable();
  const complete = vi.fn();
  let closed = false;
  const source: TableScanSource = {
    getQueryMetadata: async () =>
      createScanQueryMetadata({
        sourceType: 'test',
        queryType: 'table',
        schema: convertArrowToSchema(table.schema),
        execution: {status: 'supported', method: 'read'},
        capabilities: {}
      }),
    read: async function* () {
      try {
        yield {
          shape: 'object-row-table',
          schema: convertArrowToSchema(table.schema),
          data: [{name: 'b', value: 2}],
          length: 1
        } as TableBatch;
        throw new Error('source failed');
      } finally {
        closed = true;
      }
    }
  };
  await expect(query({}, {source, onQueryComplete: complete})).rejects.toThrow('source failed');
  expect(closed).toBe(true);
  expect(complete).toHaveBeenCalledTimes(1);
  expect(complete.mock.calls[0][0].status).toBe('failed');
  const aborted = vi.fn();
  await expect(
    query({}, {source: table, signal: AbortSignal.abort(), onQueryComplete: aborted})
  ).rejects.toThrow();
  expect(aborted).toHaveBeenCalledTimes(1);
  expect(aborted.mock.calls[0][0].status).toBe('cancelled');
  const throwing = vi.fn(() => {
    throw new Error('observer');
  });
  expect((await query({}, {source: table, onQueryComplete: throwing})).numRows).toBe(3);
});

test('consumer return closes the source and emits one terminal summary', async () => {
  const table = makeTable();
  const onQueryComplete = vi.fn();
  let closed = false;
  let pulls = 0;
  const source: TableScanSource = {
    getQueryMetadata: async () =>
      createScanQueryMetadata({
        sourceType: 'test',
        queryType: 'table',
        schema: convertArrowToSchema(table.schema),
        execution: {status: 'supported', method: 'read'},
        capabilities: {}
      }),
    read: async function* () {
      try {
        pulls++;
        yield* table.batches;
        pulls++;
        yield* table.batches;
      } finally {
        closed = true;
      }
    }
  };
  for await (const _batch of queryInBatches({}, {source, onQueryComplete})) break;
  expect(closed).toBe(true);
  expect(pulls).toBe(1);
  expect(onQueryComplete).toHaveBeenCalledTimes(1);
  expect(onQueryComplete.mock.calls[0][0]).toMatchObject({
    status: 'early-terminated',
    earlyTerminationReason: 'consumer-return'
  });
});

test('unsupported inputs and changed output types fail with one completion summary', async () => {
  const complete = vi.fn();
  await expect(
    query(
      {},
      {source: 'https://example.invalid' as unknown as arrow.Table, onQueryComplete: complete}
    )
  ).rejects.toThrow('explicit URL-capable source loaders');
  expect(complete).toHaveBeenCalledTimes(1);
  const table = makeTable();
  const drift: TableScanSource = {
    getQueryMetadata: async () =>
      createScanQueryMetadata({
        sourceType: 'test',
        queryType: 'table',
        schema: convertArrowToSchema(table.schema),
        execution: {status: 'supported', method: 'read'},
        capabilities: {}
      }),
    read: async function* () {
      const data = new arrow.Table({
        name: arrow.vectorFromArray([1], new arrow.Int32()),
        value: arrow.vectorFromArray([1], new arrow.Int32())
      });
      yield* data.batches;
    }
  };
  await expect(query({}, {source: drift})).rejects.toThrow('schema does not match');
  await expect(
    query('SELECT name, 1 AS constant WHERE value > 10', {
      source: drift,
      sqlParser: parseSQLQuery
    })
  ).rejects.toThrow('Query input schema does not match source metadata.');
});

test.each([
  'object-row-table',
  'array-row-table',
  'columnar-table'
] as const)('normalizes %s source batches to typed Arrow results', async shape => {
  const table = makeTable();
  const source: TableScanSource = {
    getQueryMetadata: async () =>
      createScanQueryMetadata({
        sourceType: 'test',
        queryType: 'table',
        schema: convertArrowToSchema(table.schema),
        execution: {status: 'supported', method: 'read'},
        capabilities: {}
      }),
    read: async function* () {
      const data =
        shape === 'object-row-table'
          ? [{name: 'b', value: 2}]
          : shape === 'array-row-table'
            ? [['b', 2]]
            : {name: ['b'], value: new Int32Array([2])};
      yield {shape, data, length: 1};
    }
  };
  const result = await query(logical, {source});
  expect(result.toArray().map(row => row.toJSON())).toEqual([{label: 'b'}]);
  expect(result.schema.fields[0].type.toString()).toBe('Utf8');
});

test('equivalent Arrow float constructors compare as the same logical output type', async () => {
  const data = new arrow.Table({
    value: arrow.vectorFromArray([1, 2], new arrow.Float(arrow.Precision.DOUBLE))
  });
  const schema = convertArrowToSchema(data.schema);
  const source: TableScanSource = {
    getQueryMetadata: async () =>
      createScanQueryMetadata({
        sourceType: 'ipc',
        queryType: 'table',
        schema,
        execution: {status: 'supported', method: 'read'},
        capabilities: {}
      }),
    read: async function* () {
      yield* data.batches;
    }
  };
  const result = await query({select: [{column: 'value', as: 'number'}]}, {source});
  expect(result.toArray().map(row => row.number)).toEqual([1, 2]);
  expect(result.getChild('number')!.data[0].values.buffer).toBe(
    data.getChild('value')!.data[0].values.buffer
  );
});

test('source nullability drift is rejected so empty and populated schemas stay consistent', async () => {
  const table = makeTable();
  const schema = {
    ...convertArrowToSchema(table.schema),
    fields: convertArrowToSchema(table.schema).fields.map(field => ({
      ...field,
      nullable: !field.nullable
    }))
  };
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
      yield* table.batches;
    }
  };
  const empty = await query({limit: 0}, {source});
  expect(empty.schema!.fields.map(field => field.nullable)).toEqual(
    schema.fields.map(field => field.nullable)
  );
  await expect(query({}, {source})).rejects.toThrow('schema does not match');
});

test('stream pagination skips filtered batches and slices only the boundary batches', async () => {
  const table = makeTable();
  const data = new arrow.Table(table.schema, [
    ...table.slice(0, 1).batches,
    ...table.slice(1, 3).batches,
    ...table.batches,
    ...table.batches
  ]);
  const source = data;
  const complete = vi.fn();
  const batches = [];
  for await (const batch of queryInBatches(
    {
      select: ['value'],
      where: logical.where,
      offset: 1,
      limit: 2
    },
    {source, onQueryComplete: complete}
  ))
    batches.push(batch);
  expect(batches.map(batch => batch.getChild('value')!.toArray())).toEqual([
    new Int32Array([3]),
    new Int32Array([2])
  ]);
  expect(batches[0].getChild('value')!.data[0].values.buffer).toBe(
    table.getChild('value')!.data[0].values.buffer
  );
  expect(complete).toHaveBeenCalledWith(expect.objectContaining({batchesRead: 3, rowsReturned: 2}));
  expect((await query({offset: 100}, {source})).numRows).toBe(0);
  await expect(query({offset: -1}, {source})).rejects.toThrow(
    'offset must be a non-negative safe integer'
  );
});

test('native Arrow queries retain the projected schema on empty streams', async () => {
  const source = arrow.tableFromArrays({value: new Int32Array([1, 2])});
  source.schema.metadata.set('source', 'native');
  // Simulate a Table constructed by another copy of Arrow.
  Object.setPrototypeOf(
    source,
    Object.defineProperties({}, Object.getOwnPropertyDescriptors(arrow.Table.prototype))
  );
  expect(Object.prototype.isPrototypeOf.call(arrow.Table.prototype, source)).toBe(false);
  const request = {select: [{column: 'value', as: 'number'}], limit: 0};
  const table = await query(request, {source});
  expect(table).toBeInstanceOf(arrow.Table);
  expect(table.numRows).toBe(0);
  expect(table.schema.names).toEqual(['number']);
  expect(table.schema.metadata.get('source')).toBe('native');
  const batches = [];
  for await (const batch of queryInBatches(request, {source})) batches.push(batch);
  expect(batches).toHaveLength(1);
  expect(batches[0]).toBeInstanceOf(arrow.RecordBatch);
  expect(batches[0].schema).toEqual(table.schema);
});

test('query can opt into math.gl spatial functions', async () => {
  const source = makeTable();
  const result = await query('SELECT ST_MakePoint(value, value) AS geometry WHERE value > 1', {
    source,
    sqlParser: parseSQLQuery,
    functions: [ST_MAKEPOINT]
  });
  expect(result.numRows).toBe(2);
  expect(result.schema.fields.map(field => field.name)).toEqual(['geometry']);
  expect(result.getChild('geometry')!.isValid(0)).toBe(true);
});
