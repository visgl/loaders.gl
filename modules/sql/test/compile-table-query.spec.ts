// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {compileSQLTableQuery, parseSQLPredicate} from '@loaders.gl/sql';

describe('compileSQLTableQuery', () => {
  test('compiles projection, predicate, qualification, and limit', () => {
    const compiled = compileSQLTableQuery(
      {
        catalogName: 'analytics',
        schemaName: 'public',
        tableName: 'flights',
        columns: ['carrier', 'fare'],
        predicate: parseSQLPredicate(
          "year >= 2024 AND cancelled = FALSE AND carrier IN ('AA', 'UA')"
        ),
        limit: 100
      },
      {dialect: 'duckdb'}
    );

    expect(compiled).toEqual({
      sql: [
        'SELECT "carrier", "fare"',
        'FROM "analytics"."public"."flights"',
        'WHERE (("year" >= ?) AND ("cancelled" = ?) AND ("carrier" IN (?, ?)))',
        'LIMIT 100'
      ].join('\n'),
      parameters: [2024, false, 'AA', 'UA']
    });
  });

  test('preserves SQL null semantics and quotes identifiers', () => {
    const compiled = compileSQLTableQuery(
      {
        tableName: 'odd"table',
        columns: ['select'],
        predicate: parseSQLPredicate('NOT deleted_at IS NULL')
      },
      {dialect: 'snowflake'}
    );

    expect(compiled.sql).toBe(
      ['SELECT "select"', 'FROM "odd""table"', 'WHERE (NOT ("deleted_at" IS NULL))'].join('\n')
    );
    expect(compiled.parameters).toEqual([]);
  });

  test('resolves retained named parameters at compilation time', () => {
    const predicate = parseSQLPredicate('fare >= :minimumFare', {preserveParameters: true});
    const compiled = compileSQLTableQuery(
      {tableName: 'flights', predicate},
      {dialect: 'duckdb', parameters: {minimumFare: 250}}
    );

    expect(compiled.sql).toContain('WHERE ("fare" >= ?)');
    expect(compiled.parameters).toEqual([250]);
  });

  test('distinguishes empty projections and quoted dotted identifiers', () => {
    expect(() =>
      compileSQLTableQuery({tableName: 'flights', columns: []}, {dialect: 'duckdb'})
    ).toThrow(/at least one column/);
    const compiled = compileSQLTableQuery(
      {tableName: 'flights', predicate: parseSQLPredicate('"metric.value" = 1')},
      {dialect: 'duckdb'}
    );
    expect(compiled.sql).toContain('"metric.value" = ?');
  });

  test('rejects missing parameters and invalid limits', () => {
    const predicate = parseSQLPredicate('fare >= :minimumFare', {preserveParameters: true});
    expect(() =>
      compileSQLTableQuery({tableName: 'flights', predicate}, {dialect: 'duckdb'})
    ).toThrow(/minimumFare.*requires a value/);
    expect(() =>
      compileSQLTableQuery({tableName: 'flights', limit: -1}, {dialect: 'duckdb'})
    ).toThrow(/non-negative/);
  });

  test('compiles portable expressions, aggregates, and ordering', () => {
    const compiled = compileSQLTableQuery(
      {
        tableName: 'flights',
        expressions: [{name: 'metric', expression: {op: 'literal', value: 1}}],
        columns: ['carrier', 'metric', 'flightCount'],
        groupBy: ['carrier'],
        aggregates: [{name: 'flightCount', function: 'count'}],
        orderBy: [{column: 'flightCount', direction: 'desc', nulls: 'last'}],
        limit: 10
      },
      {dialect: 'duckdb'}
    );

    expect(compiled.sql).toBe(
      [
        'SELECT "carrier", 1 AS "metric", COUNT(*) AS "flightCount"',
        'FROM "flights"',
        'GROUP BY "carrier"',
        'ORDER BY "flightCount" DESC NULLS LAST',
        'LIMIT 10'
      ].join('\n')
    );
  });

  test('compiles unions and qualified equi-joins', () => {
    const union = compileSQLTableQuery(
      {
        tableName: 'flights',
        columns: ['carrier'],
        union: [{source: 'archived_flights', query: {columns: ['carrier']}}]
      },
      {dialect: 'duckdb'}
    );
    expect(union.sql).toBe(
      [
        'SELECT "carrier"',
        'FROM "flights"',
        'UNION ALL',
        'SELECT "carrier"',
        'FROM "archived_flights"'
      ].join('\n')
    );

    const limitedUnion = compileSQLTableQuery(
      {
        tableName: 'flights',
        columns: ['carrier'],
        union: [{source: 'archived_flights', query: {columns: ['carrier'], limit: 1}}]
      },
      {dialect: 'duckdb'}
    );
    expect(limitedUnion.sql).toBe(
      [
        'SELECT "carrier"',
        'FROM "flights"',
        'UNION ALL',
        '(SELECT "carrier"',
        'FROM "archived_flights"',
        'LIMIT 1)'
      ].join('\n')
    );

    const join = compileSQLTableQuery(
      {
        tableName: 'flights',
        columns: ['carrier'],
        join: {child: {source: 'airlines'}, left: 'carrier', right: 'code'}
      },
      {dialect: 'duckdb'}
    );
    expect(join.sql).toContain(
      'JOIN "airlines" AS "airlines" ON "flights"."carrier" = "airlines"."code"'
    );

    const joinedProjection = compileSQLTableQuery(
      {
        tableName: 'flights',
        columns: ['airlines.name'],
        join: {child: {source: 'airlines'}, left: 'carrier', right: 'code'}
      },
      {dialect: 'duckdb'}
    );
    expect(joinedProjection.sql).toContain('SELECT "airlines"."name"');
  });

  test('rejects non-count aggregates without an input column', () => {
    expect(() =>
      compileSQLTableQuery(
        {tableName: 'flights', aggregates: [{name: 'total', function: 'sum'}]},
        {dialect: 'duckdb'}
      )
    ).toThrow(/requires a column/);
  });
});
