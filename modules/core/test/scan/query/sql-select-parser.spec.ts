// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {parseSQLQuery, parseSQLSelect} from '@loaders.gl/core/scan/query';
import type {TableQuery} from '@loaders.gl/core/scan';
import {query, queryInBatches} from '@loaders.gl/core/scan';
import {parseSQLPredicate} from '@loaders.gl/core/scan/parse-sql-predicate';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';

test('SELECT parser handles ordered aliases, qualified FROM, exact names, wildcard and limits', () => {
  expect(
    parseSQLQuery('select name, population AS people FROM warehouse.cities LIMIT 20;')
  ).toEqual({
    select: ['name', {column: 'population', as: 'people'}],
    from: {source: 'warehouse', table: 'cities'},
    limit: 20
  });
  expect(parseSQLSelect('SELECT * FROM cities LIMIT 0')).toEqual({from: 'cities', limit: 0});
  expect(parseSQLSelect('SELECT "a.b" AS "display name" FROM "warehouse.v2"."cities.v3"')).toEqual({
    select: [{column: 'a.b', as: 'display name'}],
    from: {source: 'warehouse.v2', table: 'cities.v3'}
  });
  expect(parseSQLSelect('SELECT "a""b" FROM "FROM"')).toEqual({select: ['a"b'], from: 'FROM'});
  expect(parseSQLSelect('SELECT value')).toEqual({select: ['value']});
});

test('WHERE extraction respects strings, quoted keywords, parentheses, escaping and LIMIT', () => {
  expect(
    parseSQLQuery(`SELECT name WHERE (name = 'LIMIT 2; O''Reilly' OR "not" IS NULL) LIMIT 3;`)
  ).toEqual({
    select: ['name'],
    where: {
      op: 'or',
      args: [
        {op: '=', args: [{property: 'name'}, "LIMIT 2; O'Reilly"]},
        {op: 'isNull', args: [{property: 'not', quoted: true}]}
      ]
    },
    limit: 3
  });
  expect(
    (parseSQLQuery('SELECT value WHERE value > 9007199254740993') as TableQuery).where
  ).toEqual({
    op: '>',
    args: [{property: 'value'}, 9007199254740993n]
  });
});

test('structural parser rejects WHERE unless explicitly supplied, preserving a small entry point', () => {
  expect(() => parseSQLSelect('SELECT value WHERE value > 1')).toThrow('parseWhere');
  expect(parseSQLSelect('SELECT value WHERE value > 1', {parseWhere: parseSQLPredicate})).toEqual(
    parseSQLQuery('SELECT value WHERE value > 1')
  );
  expect(() =>
    parseSQLSelect('SELECT value WHERE value > 1', {parseWhere: () => undefined as never})
  ).toThrow('must return a predicate');
});

test.each([
  '',
  'DELETE FROM cities',
  'SELECT',
  'SELECT DISTINCT name',
  'SELECT NULL',
  'SELECT 1',
  'SELECT count(value)',
  'SELECT a + b',
  'SELECT a b',
  'SELECT a FROM cities c',
  'SELECT a FROM a.b.c',
  'SELECT *, a',
  'SELECT a, *',
  'SELECT a ORDER BY a',
  'SELECT a GROUP BY a',
  'SELECT a OFFSET 1',
  'SELECT a FROM a JOIN b',
  'SELECT a UNION SELECT a',
  'SELECT a LIMIT -1',
  'SELECT a LIMIT 1.2',
  'SELECT a LIMIT 9007199254740992',
  'SELECT a LIMIT 1e2',
  'SELECT a LIMIT 1; SELECT b',
  'SELECT a WHERE',
  'SELECT a WHERE (a = 1',
  'SELECT a WHERE a = 1)',
  'SELECT a WHERE a = 1 -- comment',
  'SELECT a WHERE a = 1 /* comment */',
  'SELECT "unterminated',
  `SELECT a WHERE a = 'unterminated`,
  'SELECT a WHERE a = "TRUE"',
  'SELECT a WHERE a IS "NULL"',
  'SELECT a WHERE table.a = 1'
])('unsupported or malformed SELECT is rejected: %s', sql => {
  expect(() => parseSQLQuery(sql)).toThrow();
});

test('parser bounds input, projection tokens and nesting before execution', () => {
  expect(() => parseSQLSelect('SELECT ' + 'a'.repeat(65536))).toThrow('65536');
  expect(() =>
    parseSQLSelect('SELECT ' + Array.from({length: 3000}, (_, index) => `column${index}`).join(','))
  ).toThrow('token limit');
  expect(() =>
    parseSQLQuery('SELECT a WHERE ' + '('.repeat(65) + 'a = 1' + ')'.repeat(65))
  ).toThrow('nesting limit');
});

test('quoted WHERE identifiers execute through the injected parser and both result entry points', async () => {
  const data = new arrow.Table({
    not: arrow.vectorFromArray([0, 1], new arrow.Int32()),
    'field.name': arrow.vectorFromArray(['x', 'LIMIT 2'], new arrow.Utf8())
  });
  const source = {shape: 'arrow-table' as const, data, schema: convertArrowToSchema(data.schema)};
  const sql = `SELECT "field.name" AS label WHERE "not" > 0 AND "field.name" = 'LIMIT 2' LIMIT 1`;
  const result = await query(sql, {source, sqlParser: Promise.resolve(parseSQLQuery)});
  expect(result.data.toArray().map(row => row.label)).toEqual(['LIMIT 2']);
  const rows: unknown[] = [];
  for await (const batch of queryInBatches(sql, {source, sqlParser: parseSQLQuery}))
    rows.push(...batch.data.toArray().map(row => row.label));
  expect(rows).toEqual(['LIMIT 2']);
  expect(
    (await query('SELECT * LIMIT 0', {source, sqlParser: parseSQLSelect})).data.schema.names
  ).toEqual(['not', 'field.name']);
});

test('ARRAY construction parses into a fixed-size selection and preserves null rows', async () => {
  const sql = 'SELECT ARRAY[x, y, z] AS position, id LIMIT 3';
  expect(parseSQLQuery(sql)).toEqual({
    select: [{array: ['x', 'y', 'z'], as: 'position'}, 'id'],
    limit: 3
  });
  const data = new arrow.Table({
    id: arrow.vectorFromArray([10, 11, 12], new arrow.Int32()),
    x: arrow.vectorFromArray([1, 4, 7], new arrow.Float32()),
    y: arrow.vectorFromArray([2, null, 8], new arrow.Float32()),
    z: arrow.vectorFromArray([3, 6, 9], new arrow.Float32())
  });
  const source = {shape: 'arrow-table' as const, data, schema: convertArrowToSchema(data.schema)};
  const result = await query(sql, {source, sqlParser: parseSQLQuery});
  expect(result.data.schema.names).toEqual(['position', 'id']);
  const position = result.data.getChild('position')!;
  expect(position.type).toBeInstanceOf(arrow.FixedSizeList);
  expect((position.type as arrow.FixedSizeList).listSize).toBe(3);
  expect(position.get(1)).toBeNull();
  expect(Array.from(position.get(0)!)).toEqual([1, 2, 3]);
  expect(Array.from(position.get(2)!)).toEqual([7, 8, 9]);
  expect(Array.from(position.data[0].children[0].values as Float32Array)).toEqual([
    1, 2, 3,
    0, 0, 0,
    7, 8, 9
  ]);
  const batches = [];
  for await (const batch of queryInBatches(sql, {source, sqlParser: parseSQLQuery})) {
    batches.push(batch.data);
  }
  expect(batches.length).toBe(1);
  expect(batches[0].getChild('position')!.get(1)).toBeNull();
});

test('ARRAY syntax rejects empty operands and requires an output alias', () => {
  expect(() => parseSQLQuery('SELECT ARRAY[] AS position')).toThrow();
  expect(() => parseSQLQuery('SELECT ARRAY[x, y, z]')).toThrow();
  expect(() => parseSQLQuery('SELECT ARRAY[x, y, z] AS position')).not.toThrow();
});
