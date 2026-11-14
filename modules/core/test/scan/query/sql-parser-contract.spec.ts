// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import * as arrow from 'apache-arrow';
import {expect, test, vi} from 'vitest';
import {query, queryInBatches, type QueryOptions} from '@loaders.gl/core/scan';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';
import type {SQLQueryParser} from '@loaders.gl/core/scan';
import {parseSQLQuery} from '@loaders.gl/core/scan/query';

function source() {
  const data = new arrow.Table({
    value: arrow.vectorFromArray([1, null, 3, 4], new arrow.Int32()),
    name: arrow.vectorFromArray(['a', 'b', 'c', 'd'], new arrow.Utf8())
  });
  return {shape: 'arrow-table' as const, data, schema: convertArrowToSchema(data.schema)};
}

const baseline = {
  select: [{column: 'name', as: 'label'}],
  where: {op: '>=', args: [{property: 'value'}, 3]},
  limit: 1
} as const;
test('injected parser objects and promises execute baseline portable query shapes', async () => {
  for (const parser of [() => baseline, Promise.resolve(() => baseline)]) {
    const options = {source: source(), sqlParser: parser} as QueryOptions;
    expect(
      (await query('SELECT name AS label WHERE value >= 3 LIMIT 1', options))
        .toArray()
        .map(row => row.label)
    ).toEqual(['c']);
    const labels: string[] = [];
    for await (const batch of queryInBatches('baseline', options))
      labels.push(...[...batch].map(row => row.label));
    expect(labels).toEqual(['c']);
  }
});
test('injected baseline limits retain schema for empty results', async () => {
  const result = await query('empty', {
    source: source(),
    sqlParser: () => ({select: [{column: 'value', as: 'result'}], limit: 0})
  });
  expect(result.numRows).toBe(0);
  expect(result.schema.names).toEqual(['result']);
  expect(result.schema.fields[0]!.type).toEqual(new arrow.Int32());
});
test('streaming SQL computes projections, arrays and WHERE expressions from source columns', async () => {
  const results = [];
  for await (const batch of queryInBatches(
    'SELECT name, value + 1 AS next, ARRAY[value, value] AS pair WHERE value + 1 >= 4 LIMIT 1',
    {source: source(), sqlParser: parseSQLQuery}
  ))
    results.push(batch);
  expect(results).toHaveLength(1);
  expect(results[0]!.schema.names).toEqual(['name', 'next', 'pair']);
  expect(results[0]!.getChild('name')!.get(0)).toBe('c');
  expect(results[0]!.getChild('next')!.get(0)).toBe(4);
  expect(Array.from(results[0]!.getChild('pair')!.get(0))).toEqual([3, 3]);
});

test('explicit REAL arrays preserve null tuple validity and zero padding', async () => {
  const result = await query('SELECT ARRAY[value, value, value]::REAL[3] AS position', {
    source: source(),
    sqlParser: parseSQLQuery
  });
  const positions = result.getChild('position') as arrow.Vector<arrow.FixedSizeList>;
  expect(positions.type.listSize).toBe(3);
  expect(positions.type.valueType).toEqual(new arrow.Float32());
  expect(positions.get(1)).toBeNull();
  expect(Array.from(positions.data[0]!.children[0]!.values.slice(3, 6))).toEqual([0, 0, 0]);
  expect(Array.from(positions.get(2)!)).toEqual([3, 3, 3]);
});

test('SQL casts filter nulls and computed empty results retain the output schema', async () => {
  const options = {source: source(), sqlParser: parseSQLQuery};
  const result = await query('SELECT name WHERE CAST(value AS BIGINT) >= 3', options);
  expect(result.getChild('name')!.toArray()).toEqual(['c', 'd']);
  const empty = await query('SELECT value + 1 AS next LIMIT 0', options);
  expect(empty.numRows).toBe(0);
  expect(empty.schema.names).toEqual(['next']);
});

test.each([
  {where: {op: '=', args: [{expression: {type: 'Identifier', name: 'value'}}, 1]}},
  {where: {op: '=', args: [{property: 'value'}, {expression: {type: 'Literal', value: 1}}]}},
  {where: {op: '=', args: [{property: 'value'}, {value: 1, casts: ['int32']}]}},
  {where: {op: 'in', args: [{property: 'value'}, [{expression: {type: 'Literal', value: 1}}]]}},
  {where: {op: 'not', args: [{expression: {type: 'Identifier', name: 'value'}}]}},
  {
    where: {
      op: 'and',
      args: [{type: 'CallExpression', callee: {type: 'Identifier', name: 'cast'}, arguments: []}]
    }
  }
])('unsupported parser extensions fail before source reads: %#', async logicalQuery => {
  const read = vi.fn(),
    getQueryMetadata = vi.fn();
  const parser = (() => logicalQuery) as unknown as SQLQueryParser;
  const options = {source: {read, getQueryMetadata}, sqlParser: parser} as unknown as QueryOptions;
  await expect(query('extension', options)).rejects.toThrow(/not supported/);
  await expect(
    (async () => {
      for await (const _batch of queryInBatches('extension', options)) {
      }
    })()
  ).rejects.toThrow(/not supported/);
  expect(read).not.toHaveBeenCalled();
  expect(getQueryMetadata).not.toHaveBeenCalled();
});
test('unsupported logical queries fail before FROM source discovery', async () => {
  const getTable = vi.fn();
  const options = {
    sources: [{name: 'warehouse', getTable}],
    sqlParser: () => ({
      from: 'warehouse',
      where: {op: 'isNull', args: [{expression: {type: 'Identifier', name: 'value'}}]}
    })
  } as unknown as QueryOptions;
  await expect(query('cast', options)).rejects.toThrow('CAST');
  expect(getTable).not.toHaveBeenCalled();
});
test('rejected parser output emits one terminal error summary', async () => {
  const onQueryComplete = vi.fn();
  await expect(
    query('cast', {
      source: source(),
      sqlParser: (() => ({
        where: {op: '=', args: [{property: 'value'}, {value: 1, casts: ['int32']}]}
      })) as unknown as SQLQueryParser,
      onQueryComplete
    })
  ).rejects.toThrow('CAST');
  expect(onQueryComplete).toHaveBeenCalledTimes(1);
  expect(onQueryComplete.mock.calls[0]![0].status).toBe('failed');
});

test('catalog parser commands preserve their result schema', async () => {
  const result = await query('SHOW SOURCES', {
    sources: [],
    sqlParser: () => ({command: 'showSources'})
  });
  expect(result.numRows).toBe(0);
  expect(result.schema.names).toEqual(['source_name']);
});
test('shared predicate leaves remain valid while cycles fail without reading a source', async () => {
  const leaf = {op: '=', args: [{property: 'value'}, 3]} as const;
  const result = await query({where: {op: 'and', args: [leaf, leaf]}}, {source: source()});
  expect(result.numRows).toBe(1);
  const cycle: {op: 'not'; args: unknown[]} = {op: 'not', args: []};
  cycle.args.push(cycle);
  await expect(query({where: cycle} as never, {source: source()})).rejects.toThrow('acyclic');
});

test('oversized parser predicates reject before allocating a traversal stack', async () => {
  const leaf = {op: '=', args: [{property: 'value'}, 1]} as const;
  await expect(
    query({where: {op: 'and', args: new Array(4096).fill(leaf)}}, {source: source()})
  ).rejects.toThrow('4096');
});
