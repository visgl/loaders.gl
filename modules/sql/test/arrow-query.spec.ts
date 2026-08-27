// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import type {ArrowTable} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';

import {
  ARROW_TABLE_QUERY_CAPABILITIES,
  ArrowTableSource,
  bindSQLPredicate,
  parseSQLPredicate,
  planTableQuery,
  queryArrowTable
} from '@loaders.gl/sql';

test('Arrow executor advertises portable query capabilities', () => {
  expect(ARROW_TABLE_QUERY_CAPABILITIES).toEqual({
    projection: 'residual',
    predicate: 'residual',
    limit: 'residual',
    streaming: false,
    cancellation: true,
    expressions: 'residual',
    orderBy: 'residual',
    aggregates: 'residual'
  });
  expect(Object.isFrozen(ARROW_TABLE_QUERY_CAPABILITIES)).toBe(true);
});

test('ArrowTableSource exposes shared metadata and bounded scan batches', async () => {
  const source = new ArrowTableSource(makeArrowTable({x: [1, 2], value: [10, 20]}));

  const metadata = await source.getQueryMetadata();
  expect(metadata.queryType).toBe('table');
  expect(metadata.columns.map(column => [column.name, column.role])).toEqual([
    ['x', 'x'],
    ['value', 'attribute']
  ]);
  expect(metadata.statistics?.rowCount).toBe(2);

  const batches = [];
  for await (const batch of source.read({columns: ['value'], limit: 1})) {
    batches.push(batch);
  }
  expect(batches).toHaveLength(1);
  expect(batches[0].length).toBe(1);
  expect(batches[0].data.schema.fields.map(field => field.name)).toEqual(['value']);
});

test('ArrowTableSource assigns coordinate, time, and attribute roles', async () => {
  const source = new ArrowTableSource(
    makeArrowTable({
      longitude: [1],
      lat: [2],
      elevation: [3],
      event_time: [4],
      label: ['x'],
      y: [5],
      z: [6],
      altitude: [7],
      time: [8],
      updatedTimestamp: [9]
    })
  );

  const metadata = await source.getQueryMetadata();
  expect(metadata.columns.map(column => [column.name, column.role])).toEqual([
    ['longitude', 'longitude'],
    ['lat', 'latitude'],
    ['elevation', 'attribute'],
    ['event_time', 'time'],
    ['label', 'attribute'],
    ['y', 'y'],
    ['z', 'z'],
    ['altitude', 'attribute'],
    ['time', 'time'],
    ['updatedTimestamp', 'time']
  ]);
});

test('ArrowTableSource rejects already-aborted metadata requests', async () => {
  const controller = new AbortController();
  controller.abort();
  const source = new ArrowTableSource(makeArrowTable({value: [1]}));

  await expect(source.getQueryMetadata({signal: controller.signal})).rejects.toThrow(/aborted/);
});

test('queryArrowTable filters, projects, and limits Arrow data', () => {
  const table = makeArrowTable({
    year: [2023, 2024, 2025, 2026],
    cancelled: [false, true, false, false],
    carrier: ['AA', 'BB', 'CC', 'DD'],
    fare: [120, 240, 180, 320]
  });

  const result = queryArrowTable(table, {
    predicate: parseSQLPredicate('year >= 2024 AND cancelled = FALSE'),
    columns: ['carrier', 'fare'],
    limit: 1
  });

  expect(result.data.schema.fields.map(field => field.name)).toEqual(['carrier', 'fare']);
  expect(toRows(result)).toEqual([{carrier: 'CC', fare: 180}]);
});

test('queryArrowTable applies SQL null semantics and keeps predicate columns internal', () => {
  const table = makeArrowTable({
    status: ['valid', null, 'invalid', 'valid'],
    payload: [1, 2, 3, 4]
  });

  const result = queryArrowTable(table, {
    predicate: parseSQLPredicate("NOT (status = 'invalid')"),
    columns: ['payload']
  });

  expect(toRows(result)).toEqual([{payload: 1}, {payload: 4}]);
});

test('queryArrowTable permits a projected column to also appear in the predicate', () => {
  const table = makeArrowTable({status: ['valid', 'invalid', 'valid']});

  const result = queryArrowTable(table, {
    predicate: parseSQLPredicate("status = 'valid'"),
    columns: ['status']
  });

  expect(toRows(result)).toEqual([{status: 'valid'}, {status: 'valid'}]);
});

test('planTableQuery retains predicate columns before projecting the requested output', () => {
  const predicate = parseSQLPredicate('year >= 2024 AND cancelled = FALSE');

  expect(
    planTableQuery(['year', 'cancelled', 'carrier', 'fare'], {
      predicate,
      columns: ['carrier', 'fare'],
      limit: 20
    })
  ).toEqual([
    {kind: 'scan', columns: ['year', 'cancelled', 'carrier', 'fare']},
    {kind: 'filter', predicate},
    {kind: 'project', columns: ['carrier', 'fare']},
    {kind: 'limit', limit: 20}
  ]);
});

test('queryArrowTable requires named parameters to be bound immediately before execution', () => {
  const predicate = parseSQLPredicate('value >= :minimum', {preserveParameters: true});
  const table = makeArrowTable({value: [1, 2, 3]});

  expect(() => queryArrowTable(table, {predicate})).toThrow(/must be bound/);
  expect(
    toRows(queryArrowTable(table, {predicate: bindSQLPredicate(predicate, {minimum: 2})}))
  ).toEqual([{value: 2}, {value: 3}]);
});

test('queryArrowTable retains zero-copy Arrow views for projection and limit without filtering', () => {
  const table = makeArrowTable({first: [1, 2, 3], second: ['a', 'b', 'c']});

  const result = queryArrowTable(table, {columns: ['second'], limit: 2});

  expect(result.data.numRows).toBe(2);
  expect(result.data.schema.fields.map(field => field.name)).toEqual(['second']);
  expect(toRows(result)).toEqual([{second: 'a'}, {second: 'b'}]);
});

test('queryArrowTable evaluates expressions, ordering, and global limits', () => {
  const result = queryArrowTable(makeArrowTable({id: [1, 2, 3], value: [4, 1, 3]}), {
    expressions: [{name: 'score', expression: {op: 'multiply', left: 'value', right: 'value'}}],
    columns: ['id', 'score'],
    orderBy: [{column: 'score', direction: 'desc'}],
    limit: 2
  });

  expect(toRows(result)).toEqual([
    {id: 1, score: 16},
    {id: 3, score: 9}
  ]);
});

test('queryArrowTable performs SQL-like grouped aggregates and null handling', () => {
  const result = queryArrowTable(makeArrowTable({group: ['a', 'a', 'b'], value: [2, null, 5]}), {
    groupBy: ['group'],
    aggregates: [
      {name: 'countValues', function: 'count', column: 'value'},
      {name: 'total', function: 'sum', column: 'value'},
      {name: 'average', function: 'avg', column: 'value'}
    ],
    columns: ['group', 'countValues', 'total', 'average'],
    orderBy: [{column: 'group'}]
  });

  expect(toRows(result)).toEqual([
    {group: 'a', countValues: 1, total: 2, average: 2},
    {group: 'b', countValues: 1, total: 5, average: 5}
  ]);
});

test.each([
  [{columns: ['missing']}, /column not found/],
  [{columns: ['value', 'value']}, /more than once/],
  [{limit: -1}, /non-negative/],
  [{limit: 1.5}, /safe integer/]
])('queryArrowTable rejects invalid query options %o', (options, expectedError) => {
  const table = makeArrowTable({value: [1, 2, 3]});
  expect(() => queryArrowTable(table, options)).toThrow(expectedError);
});

test('queryArrowTable reports cancellation before scanning', () => {
  const controller = new AbortController();
  controller.abort();

  expect(() => queryArrowTable(makeArrowTable({value: [1]}), {signal: controller.signal})).toThrow(
    /aborted/
  );
});

/** Wraps simple test columns in the loaders.gl Arrow table shape. */
function makeArrowTable(columns: Record<string, readonly unknown[]>): ArrowTable {
  const data = arrow.tableFromArrays(columns);
  return {shape: 'arrow-table', schema: convertArrowToSchema(data.schema), data};
}

/** Converts Arrow rows to plain objects for readable assertions. */
function toRows(table: ArrowTable): Record<string, unknown>[] {
  return table.data.toArray().map(row => row?.toJSON() ?? {});
}
