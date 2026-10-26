// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {
  bindSQLPredicate,
  isSQLPredicate,
  parseSQLPredicate,
  SQL_PREDICATE_JSON_SCHEMA,
  validateSQLPredicate
} from '@loaders.gl/sql/sql-predicate';
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
      {op: 'not', args: [{op: 'isNull', args: [{property: 'source id', quoted: true}]}]},
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

test('parseSQLPredicate preserves dots inside quoted identifiers', () => {
  expect(parseSQLPredicate('"metric.value" = 1')).toEqual({
    op: '=',
    args: [{property: 'metric.value', quoted: true}, 1]
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

test('parseSQLPredicate can preserve named parameters for late binding', () => {
  const predicate = parseSQLPredicate('value >= :minimum AND active = :active', {
    preserveParameters: true
  });

  expect(predicate).toEqual({
    op: 'and',
    args: [
      {op: '>=', args: [{property: 'value'}, {parameter: 'minimum'}]},
      {op: '=', args: [{property: 'active'}, {parameter: 'active'}]}
    ]
  });
  expect(bindSQLPredicate(predicate, {minimum: 10, active: true})).toEqual({
    op: 'and',
    args: [
      {op: '>=', args: [{property: 'value'}, 10]},
      {op: '=', args: [{property: 'active'}, true]}
    ]
  });
  expect(() => bindSQLPredicate(predicate, {minimum: 10})).toThrow(/:active/);
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
  expect(SQL_PREDICATE_JSON_SCHEMA.$defs.value.oneOf).toHaveLength(2);
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

test('parseSQLPredicate parses decimal, exponent, and negative numeric literals', () => {
  expect(parseSQLPredicate('ratio > -1.25 AND score = 1e3 AND count = 9007199254740993')).toEqual({
    op: 'and',
    args: [
      {op: '>', args: [{property: 'ratio'}, -1.25]},
      {op: '=', args: [{property: 'score'}, 1000]},
      {op: '=', args: [{property: 'count'}, 9007199254740993n]}
    ]
  });
});

test.each([
  [':', /invalid parameter/],
  ['value = @', /unsupported token/],
  ['value = -name', /unary minus/],
  ['value = 1e999', /finite/]
])('parseSQLPredicate rejects malformed scalar syntax %o', (source, expectedError) => {
  expect(() => parseSQLPredicate(source)).toThrow(expectedError);
});

test('parseSQLPredicate enforces input size and expression depth limits', () => {
  expect(() => parseSQLPredicate('value = 1'.repeat(8000))).toThrow(/safely bounded/);
  const deeplyNestedPredicate = `${'('.repeat(65)}value = 1${')'.repeat(65)}`;
  expect(() => parseSQLPredicate(deeplyNestedPredicate)).toThrow(/safe limit/);
});
