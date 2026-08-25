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

  test('rejects missing parameters and invalid limits', () => {
    const predicate = parseSQLPredicate('fare >= :minimumFare', {preserveParameters: true});
    expect(() =>
      compileSQLTableQuery({tableName: 'flights', predicate}, {dialect: 'duckdb'})
    ).toThrow(/minimumFare.*requires a value/);
    expect(() =>
      compileSQLTableQuery({tableName: 'flights', limit: -1}, {dialect: 'duckdb'})
    ).toThrow(/non-negative/);
  });
});
