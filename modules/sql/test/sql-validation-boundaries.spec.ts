// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  compileSQLTableQuery,
  explainTableQuery,
  isSQLPredicate,
  parseSQLPredicate,
  validateSQLPredicate
} from '@loaders.gl/sql';
import type {SQLPredicate, SQLTableQuery} from '@loaders.gl/sql';

describe('SQL predicate structural boundaries', () => {
  test.each([
    [{op: 1, args: []}, /string op and array args/],
    [{op: '=', args: {}}, /string op and array args/],
    [{op: 'not', args: []}, /exactly one argument/],
    [{op: 'isNull', args: [{property: 'value'}, 1]}, /exactly one argument/],
    [{op: '=', args: [{property: 'value'}]}, /exactly two arguments/],
    [{op: 'unsupported', args: []}, /unsupported operator/],
    [{op: '=', args: [{property: 'value', quoted: 'yes'}, 1]}, /property reference/],
    [{op: '=', args: [{property: 'value'}, new Date(NaN)]}, /unsupported scalar/]
  ])('rejects invalid node %# with a specific diagnostic', (predicate, message) => {
    expect(() => validateSQLPredicate(predicate)).toThrow(message);
    expect(isSQLPredicate(predicate)).toBe(false);
  });

  test('limits recursion depth and total node count independently', () => {
    const leaf: SQLPredicate = {op: 'isNull', args: [{property: 'value'}]};
    let nested: SQLPredicate = leaf;
    for (let depth = 0; depth < 65; depth++) nested = {op: 'not', args: [nested]};
    expect(() => validateSQLPredicate(nested)).toThrow(/maximum nesting depth/);
    expect(() => validateSQLPredicate({op: 'or', args: Array(4096).fill(leaf)})).toThrow(
      /maximum node count/
    );
    expect(() => validateSQLPredicate({op: 'or', args: [leaf, leaf]})).not.toThrow();
  });

  test('accepts every structured scalar representation', () => {
    for (const value of [true, 1n, 'text', new Uint8Array([1]), 1.5, new Date(0)]) {
      expect(isSQLPredicate({op: '=', args: [{property: 'value'}, value]})).toBe(true);
    }
  });

  test.each([
    ['1 = 1', /column identifier/],
    ['value =', /scalar value/],
    ['value = other', /scalar token/],
    ['value IS TRUE', /expected NULL/],
    ['value IN (1', /expected "\)"/],
    ['value = :', /invalid parameter/]
  ])('rejects malformed SQL %s', (source, message) => {
    expect(() => parseSQLPredicate(source)).toThrow(message);
  });

  test('rejects an invalid bound parameter at the parser boundary', () => {
    expect(() => parseSQLPredicate('value = :value', {parameters: {value: NaN}})).toThrow(
      /parameter.*unsupported value/
    );
  });

  test('explains predicate dependencies independently of output projection', () => {
    const explanation = explainTableQuery(['value', 'label'], {
      columns: ['label'],
      predicate: {op: '=', args: [{property: 'value'}, 1]},
      limit: 0
    });
    expect(explanation.outputColumns).toEqual(['label']);
    expect(explanation.predicateColumns).toEqual(['value']);
    // Scan dependencies retain source order, including columns hidden from the projection.
    expect(explanation.requiredColumns).toEqual(['value', 'label']);
    expect(explanation.operators.limit.enabled).toBe(true);
    expect(() => explainTableQuery(['value'], {predicate: {op: 'not', args: []} as never})).toThrow(
      /exactly one argument/
    );
  });
});

describe('SQL compiler projection and validation boundaries', () => {
  test('infers expression-only and aggregate-only projections', () => {
    const expressions = compileSQLTableQuery(
      {
        tableName: 'measurements',
        expressions: [
          {name: 'copied', expression: {op: 'column', column: 'value'}},
          {name: 'missing', expression: {op: 'literal', value: null}},
          {name: 'label', expression: {op: 'literal', value: "it's small"}}
        ]
      },
      {dialect: 'duckdb'}
    );
    expect(expressions.sql).toBe(
      'SELECT "value" AS "copied", NULL AS "missing", \'it\'\'s small\' AS "label"\nFROM "measurements"'
    );
    const aggregate = compileSQLTableQuery(
      {
        tableName: 'measurements',
        aggregates: [{name: 'total', function: 'sum', column: 'value'}]
      },
      {dialect: 'snowflake'}
    );
    expect(aggregate.sql).toBe('SELECT SUM("value") AS "total"\nFROM "measurements"');
  });

  test.each([
    [{columns: ['value', 'value']}, /selected more than once/],
    [{schemaName: ''}, /non-empty/],
    [{catalogName: 'bad\0catalog'}, /NUL/],
    [{orderBy: [{column: 'value', direction: 'sideways'}]}, /Invalid order direction/],
    [{orderBy: [{column: 'value', nulls: 'middle'}]}, /Invalid null placement/],
    [
      {
        expressions: [
          {name: 'copy', expression: {op: 'column', column: 'value'}},
          {name: 'copy', expression: {op: 'literal', value: 1}}
        ]
      },
      /duplicates column/
    ],
    [{expressions: [{name: 'copy', expression: {op: 'column', column: ''}}]}, /non-empty/],
    [{groupBy: ['']}, /non-empty/]
  ])('rejects malformed relational query %#', (options, message) => {
    expect(() =>
      compileSQLTableQuery({tableName: 'measurements', ...options} as SQLTableQuery, {
        dialect: 'duckdb'
      })
    ).toThrow(message);
  });

  test('groups without explicit columns and preserves ordered nested union branches', () => {
    const childQuery = {
      columns: ['value'],
      orderBy: [{column: 'value', nulls: 'first' as const}],
      union: [{source: 'older'}]
    };
    const compiled = compileSQLTableQuery(
      {
        tableName: 'measurements',
        groupBy: ['value'],
        union: [
          {
            source: 'archive',
            query: childQuery
          }
        ]
      },
      {dialect: 'duckdb'}
    );
    expect(compiled.sql).toBe(
      [
        'SELECT "value"',
        'FROM "measurements"',
        'GROUP BY "value"',
        'UNION ALL',
        '(SELECT "value"',
        'FROM "archive"',
        'UNION ALL',
        'SELECT *',
        'FROM "older"',
        'ORDER BY "value" ASC NULLS FIRST)'
      ].join('\n')
    );
  });
});
