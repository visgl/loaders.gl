// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {
  bindColumnarPredicateParameters,
  explainTableQuery,
  planTableQuery,
  validateTableQueryLimit,
  type ParameterizedColumnarPredicate
} from '../../../src';

describe('portable table queries', () => {
  test('plans hidden predicate columns before caller projection and limit', () => {
    const predicate = {
      op: '>=',
      args: [{property: ['metrics', 'population']}, 100]
    } as const;

    expect(
      planTableQuery(['name', 'metrics', 'region'], {
        predicate,
        columns: ['name'],
        limit: 2
      })
    ).toEqual([
      {kind: 'scan', columns: ['name', 'metrics']},
      {kind: 'filter', predicate},
      {kind: 'project', columns: ['name']},
      {kind: 'limit', limit: 2}
    ]);
  });

  test('binds named values immutably throughout a predicate tree', () => {
    const predicate: ParameterizedColumnarPredicate = {
      op: 'and',
      args: [
        {op: '>=', args: [{property: 'value'}, {parameter: 'minimum'}]},
        {
          op: 'in',
          args: [{property: ['metadata', 'status']}, [{parameter: 'status'}, 'ready']]
        }
      ]
    };
    const bound = bindColumnarPredicateParameters(predicate, {
      minimum: 10,
      status: 'active'
    });

    expect(bound).toEqual({
      op: 'and',
      args: [
        {op: '>=', args: [{property: 'value'}, 10]},
        {op: 'in', args: [{property: ['metadata', 'status']}, ['active', 'ready']]}
      ]
    });
    expect(predicate.args[0].args[1]).toEqual({parameter: 'minimum'});
    expect(() => bindColumnarPredicateParameters(predicate, {minimum: 10})).toThrow(/:status/);
    expect(() =>
      bindColumnarPredicateParameters(predicate, {
        minimum: Number.NaN,
        status: 'active'
      })
    ).toThrow(/unsupported value/);
  });

  test('explains pushed and residual operators without reading rows', () => {
    const explanation = explainTableQuery(
      ['name', 'value'],
      {predicate: {op: '>', args: [{property: 'value'}, 10]}, columns: ['name'], limit: 3},
      {
        projection: 'pushdown',
        predicate: 'residual',
        limit: 'unsupported',
        streaming: true,
        cancellation: true
      }
    );

    expect(explanation.requiredColumns).toEqual(['name', 'value']);
    expect(explanation.operators).toEqual({
      projection: {enabled: true, support: 'pushdown'},
      predicate: {enabled: true, support: 'residual'},
      limit: {enabled: true, support: 'unsupported'}
    });
    expect(explanation.plan[0]).toEqual({kind: 'scan', columns: ['name', 'value']});
  });

  test.each([
    -1,
    1.5,
    Number.MAX_SAFE_INTEGER + 1
  ])('rejects invalid limit %s independently of source planning', limit => {
    expect(() => validateTableQueryLimit(limit)).toThrow(/non-negative safe integer/);
  });
});
