// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import * as arrow from 'apache-arrow';
import {expect, test, vi} from 'vitest';
import {query, queryInBatches, type QueryOptions} from '@loaders.gl/core/scan';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';
import type {SQLQueryParser} from '@loaders.gl/core/scan';

function source() {
  const data = new arrow.Table({
    value: arrow.vectorFromArray([1, null, 3, 4], new arrow.Int32()),
    name: arrow.vectorFromArray(['a', 'b', 'c', 'd'], new arrow.Utf8())
  });
  return {shape: 'arrow-table' as const, data, schema: convertArrowToSchema(data.schema)};
}
// Portable parser outputs intentionally mirror math.gl; no unreleased dependency is required.
const baseline = {
  select: [{column: 'name', as: 'label'}],
  where: {op: '>=', args: [{property: 'value'}, 3]},
  limit: 1
} as const;
test('injected parser objects and promises execute baseline portable query shapes', async () => {
  for (const parser of [() => baseline, Promise.resolve(() => baseline)]) {
    const options = {source: source(), sqlParser: parser} as QueryOptions;
    expect(
      (await query('SELECT name AS label WHERE value >= 3 LIMIT 1', options)).data
        .toArray()
        .map(row => row.label)
    ).toEqual(['c']);
    const labels: string[] = [];
    for await (const batch of queryInBatches('baseline', options))
      labels.push(...batch.data.toArray().map(row => row.label));
    expect(labels).toEqual(['c']);
  }
});
test('injected baseline limits retain schema for empty results', async () => {
  const result = await query('empty', {
    source: source(),
    sqlParser: () => ({select: [{column: 'value', as: 'result'}], limit: 0})
  });
  expect(result.data.numRows).toBe(0);
  expect(result.data.schema.names).toEqual(['result']);
  expect(result.data.schema.fields[0]!.type).toEqual(new arrow.Int32());
});
test.each([
  {select: [{expression: {type: 'Identifier', name: 'value'}, as: 'computed'}]},
  {select: [{array: ['value'], as: 'position'}]},
  {where: {op: '=', args: [{property: 'value', casts: ['int32']}, 1]}},
  {where: {op: 'not', args: [{op: 'isNull', args: [{property: 'value', casts: ['int32']}]}]}},
  {
    where: {
      op: 'and',
      args: [
        {op: '=', args: [{property: 'value'}, 1]},
        {op: 'in', args: [{property: 'value', casts: ['int64']}, [1n]]}
      ]
    }
  },
  {where: {op: '=', args: [{expression: {type: 'Identifier', name: 'value'}}, 1]}}
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
      where: {op: 'isNull', args: [{property: 'value', casts: ['float64']}]}
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
        where: {op: '=', args: [{property: 'value', casts: ['int32']}, 1]}
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
  expect(result.data.numRows).toBe(0);
  expect(result.data.schema.names).toEqual(['source_name']);
});
test('shared predicate leaves remain valid while cycles fail without reading a source', async () => {
  const leaf = {op: '=', args: [{property: 'value'}, 3]} as const;
  const result = await query({where: {op: 'and', args: [leaf, leaf]}}, {source: source()});
  expect(result.data.numRows).toBe(1);
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
