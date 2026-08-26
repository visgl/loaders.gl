// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {planRelationalQuery, validateRasterQueryOptions} from '../../../src';

describe('raster query validation', () => {
  test('accepts bounded multiscale requests', () => {
    expect(() =>
      validateRasterQueryOptions({
        bounds: [
          [0, 1],
          [10, 11]
        ],
        width: 256,
        height: 128,
        level: 2,
        channels: [0, 3],
        slices: {time: [0, 4]}
      })
    ).not.toThrow();
  });

  test('rejects inverted bounds and invalid dimensions', () => {
    expect(() =>
      validateRasterQueryOptions({
        bounds: [
          [2, 0],
          [1, 1]
        ]
      })
    ).toThrow();
    expect(() => validateRasterQueryOptions({width: 0})).toThrow();
    expect(() => validateRasterQueryOptions({level: -1})).toThrow();
  });
});

describe('relational query planning', () => {
  test('retains table plan and relational operators', () => {
    const plan = planRelationalQuery(['id', 'value'], {
      columns: ['id'],
      expressions: [
        {name: 'doubleValue', expression: {op: 'multiply', left: 'value', right: 'value'}}
      ],
      orderBy: [{column: 'doubleValue', direction: 'desc'}],
      groupBy: ['id'],
      aggregates: [{name: 'total', function: 'sum', column: 'value'}],
      limit: 5
    });
    expect(plan.tablePlan[0]).toMatchObject({kind: 'scan', columns: ['id', 'value']});
    expect(plan.tablePlan.map(step => step.kind)).toEqual(['scan', 'project', 'limit']);
    expect(plan.relationalSteps.map(step => step.kind)).toEqual([
      'expression',
      'order',
      'aggregate'
    ]);
  });

  test('rejects references to unavailable relational columns', () => {
    expect(() => planRelationalQuery(['id'], {orderBy: [{column: 'missing'}]})).toThrow(
      'Relational order column not found'
    );
  });
});
