// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import type {ArrowTable} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import {parseSQLPredicate, queryArrowTable} from '@loaders.gl/sql';

test('queryArrowTable covers null truth tables and scalar comparison families', () => {
  const nullable = makeArrowTable({value: [null, 1, 2], label: ['null', 'one', 'two']});
  expect(
    toRows(
      queryArrowTable(nullable, {
        predicate: parseSQLPredicate('value IS NULL OR value > 1'),
        columns: ['label']
      })
    )
  ).toEqual([{label: 'null'}, {label: 'two'}]);
  expect(
    toRows(
      queryArrowTable(nullable, {
        predicate: parseSQLPredicate('value = 99 OR value IS NULL'),
        columns: ['label']
      })
    )
  ).toEqual([{label: 'null'}]);

  const bigintTable = makeArrowTable({value: [1n, 2n, 3n]});
  expect(
    toRows(
      queryArrowTable(bigintTable, {
        predicate: {op: '>=', args: [{property: 'value'}, 2]} as any
      })
    ).map(row => row.value)
  ).toEqual([2n, 3n]);
  expect(
    toRows(
      queryArrowTable(makeArrowTable({value: [1, 2, 3]}), {
        predicate: {op: '<', args: [{property: 'value'}, 3n]} as any
      })
    ).map(row => row.value)
  ).toEqual([1, 2]);

  expect(
    toRows(
      queryArrowTable(makeArrowTable({value: [false, true]}), {
        predicate: {op: '>', args: [{property: 'value'}, false]}
      })
    )
  ).toEqual([{value: true}]);
  expect(() =>
    queryArrowTable(makeArrowTable({value: ['1']}), {
      predicate: {op: '=', args: [{property: 'value'}, 1]}
    })
  ).toThrow(/cannot compare string with number/);
});

test('queryArrowTable compares Date and binary predicate values', () => {
  const firstDate = new Date('2020-01-01T00:00:00Z');
  const secondDate = new Date('2021-01-01T00:00:00Z');
  const dates = makeArrowTable({value: [firstDate, secondDate]});
  expect(() =>
    queryArrowTable(dates, {
      predicate: {op: '=', args: [{property: 'value'}, secondDate]} as any
    })
  ).toThrow(/cannot compare number with Date/);

  const binaryData = new arrow.Table({
    value: arrow.vectorFromArray(
      [new Uint8Array([1, 2]), new Uint8Array([1, 3])],
      new arrow.Binary()
    )
  });
  const binary: ArrowTable = {
    shape: 'arrow-table',
    schema: convertArrowToSchema(binaryData.schema),
    data: binaryData
  };
  expect(
    toRows(
      queryArrowTable(binary, {
        predicate: {op: '<', args: [{property: 'value'}, new Uint8Array([1, 3])]} as any
      })
    )
  ).toHaveLength(1);
  expect(
    toRows(
      queryArrowTable(binary, {
        predicate: {op: '>', args: [{property: 'value'}, new Uint8Array([1])]} as any
      })
    )
  ).toHaveLength(2);
});

test('queryArrowTable stabilizes multi-key ordering with explicit null placement', () => {
  const result = queryArrowTable(
    makeArrowTable({group: ['b', 'a', 'a', 'a'], value: [1, null, 2, 2], order: [0, 0, 2, 1]}),
    {
      columns: ['group', 'value', 'order'],
      orderBy: [
        {column: 'group'},
        {column: 'value', nulls: 'first'},
        {column: 'order', direction: 'desc'}
      ]
    }
  );
  expect(toRows(result)).toEqual([
    {group: 'a', value: null, order: 0},
    {group: 'a', value: 2, order: 2},
    {group: 'a', value: 2, order: 1},
    {group: 'b', value: 1, order: 0}
  ]);
});

test('queryArrowTable covers empty global aggregates and union dependencies', () => {
  const emptyAggregate = queryArrowTable(makeArrowTable({value: [1]}), {
    predicate: parseSQLPredicate('value > 10'),
    aggregates: [
      {name: 'rows', function: 'count'},
      {name: 'sum', function: 'sum', column: 'value'},
      {name: 'average', function: 'avg', column: 'value'}
    ]
  });
  expect(toRows(emptyAggregate)).toEqual([{rows: 0}]);

  const union = queryArrowTable(makeArrowTable({left: [1], right: [2], ignored: [9]}), {
    union: [{source: 'child'}],
    tables: {child: makeArrowTable({left: [3], right: [4], ignored: [8]})},
    expressions: [{name: 'total', expression: {op: 'add', left: 'left', right: 'right'}}],
    columns: ['total'],
    orderBy: [{column: 'total', direction: 'desc'}]
  });
  expect(toRows(union)).toEqual([{total: 7}, {total: 3}]);
});

test('queryArrowTable join skips null keys and applies child queries', () => {
  const result = queryArrowTable(makeArrowTable({id: [null, 1, 2], value: ['n', 'a', 'b']}), {
    join: {
      child: {source: 'lookup', query: {columns: ['id', 'label'], limit: 1}},
      left: 'id',
      right: 'id'
    },
    tables: {lookup: makeArrowTable({id: [1, 2, null], label: ['one', 'two', 'null']})},
    columns: ['value', 'lookup.label'],
    limit: 5
  });
  expect(toRows(result)).toEqual([{value: 'a', 'lookup.label': 'one'}]);
});

function makeArrowTable(columns: Record<string, readonly unknown[]>): ArrowTable {
  const data = arrow.tableFromArrays(columns);
  return {shape: 'arrow-table', schema: convertArrowToSchema(data.schema), data};
}

function toRows(table: ArrowTable): Record<string, unknown>[] {
  return table.data.toArray().map(row => row?.toJSON() ?? {});
}
