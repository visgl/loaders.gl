// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {
  isSQLPredicate,
  parseSQLPredicate,
  SQL_PREDICATE_JSON_SCHEMA,
  validateSQLPredicate
} from '@loaders.gl/sql';
import {SQLPredicateSchema} from '@loaders.gl/sql/sql-predicate-zod';

test('parseSQLPredicate emits a CQL2-shaped AST with SQL precedence', () => {
  expect(
    parseSQLPredicate("status = 'valid' OR category IN ('a', 'b') AND value >= :minimum", {
      parameters: {minimum: 10}
    })
  ).toEqual({
    op: 'or',
    args: [
      {op: '=', args: [{property: 'status'}, 'valid']},
      {
        op: 'and',
        args: [
          {op: 'in', args: [{property: 'category'}, ['a', 'b']]},
          {op: '>=', args: [{property: 'value'}, 10]}
        ]
      }
    ]
  });
});

test('parseSQLPredicate normalizes null, inequality, negation, identifiers, and exact integers', () => {
  expect(
    parseSQLPredicate(
      '"source id" IS NOT NULL AND NOT (count != -9223372036854775808 OR active = FALSE)'
    )
  ).toEqual({
    op: 'and',
    args: [
      {op: 'not', args: [{op: 'isNull', args: [{property: 'source id'}]}]},
      {
        op: 'not',
        args: [
          {
            op: 'or',
            args: [
              {op: '<>', args: [{property: 'count'}, -9223372036854775808n]},
              {op: '=', args: [{property: 'active'}, false]}
            ]
          }
        ]
      }
    ]
  });
});

test('parseSQLPredicate preserves escaped strings and structured-cloneable parameters', () => {
  const timestamp = new Date('2026-08-20T00:00:00Z');
  const binary = new Uint8Array([1, 2, 3]);
  expect(
    parseSQLPredicate("name = 'O''Brien' AND timestamp >= :timestamp AND payload = :binary;", {
      parameters: {timestamp, binary}
    })
  ).toEqual({
    op: 'and',
    args: [
      {op: '=', args: [{property: 'name'}, "O'Brien"]},
      {op: '>=', args: [{property: 'timestamp'}, timestamp]},
      {op: '=', args: [{property: 'payload'}, binary]}
    ]
  });
});

test('SQL predicate validators accept supported ASTs and reject malformed payloads', () => {
  const predicate = {op: '=', args: [{property: 'value'}, 4]} as const;
  expect(isSQLPredicate(predicate)).toBe(true);
  expect(() => validateSQLPredicate(predicate)).not.toThrow();
  expect(SQLPredicateSchema.parse(predicate)).toEqual(predicate);

  expect(isSQLPredicate({op: 'and', args: [predicate]})).toBe(false);
  expect(isSQLPredicate({op: 'in', args: [{property: 'value'}, []]})).toBe(false);
  expect(isSQLPredicate({op: '=', args: [{property: 'value'}, Number.NaN]})).toBe(false);
  expect(isSQLPredicate({op: '=', args: [{property: 'value'}, 1], extra: true})).toBe(false);
  expect(() => SQLPredicateSchema.parse({op: 'not', args: []})).toThrow();
});

test('SQL predicate JSON Schema describes the dependency-free JSON payload subset', () => {
  expect(SQL_PREDICATE_JSON_SCHEMA.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
  expect(SQL_PREDICATE_JSON_SCHEMA.$defs.logical.properties.args.minItems).toBe(2);
  expect(SQL_PREDICATE_JSON_SCHEMA.$defs.value.type).toEqual(['boolean', 'number', 'string']);
});

test.each([
  ['', /non-empty/],
  ['WHERE value = 1', /expected a comparison/],
  ['value = NULL', /must use IS NULL/],
  ['value IN ()', /requires at least one scalar value/],
  ['value = :missing', /requires a value/],
  ["value = 'unterminated", /unterminated/],
  ['value LIKE 1', /expected a comparison/],
  ['value = 1 trailing', /unexpected token/]
])('parseSQLPredicate rejects unsupported input %o', (source, expectedError) => {
  expect(() => parseSQLPredicate(source)).toThrow(expectedError);
});
