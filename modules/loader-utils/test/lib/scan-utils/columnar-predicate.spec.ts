// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {
  copyColumnarPredicate,
  filterColumnarRowIndices,
  gatherColumnarColumns,
  getColumnarPredicateColumns,
  getColumnarPredicatePaths,
  validateColumnarPredicate
} from '../../../src/lib/scan-utils/columnar-predicate';

describe('format-neutral columnar predicates', () => {
  test('collects unique top-level columns and nested paths', () => {
    const predicate = {
      op: 'and' as const,
      args: [
        {op: '=', args: [{property: 'id'}, 7]} as const,
        {op: 'isNull', args: [{property: ['address', 'city']}]} as const,
        {op: '>', args: [{property: 'id'}, 1]} as const
      ]
    };

    expect(getColumnarPredicateColumns(predicate)).toEqual(['id', 'address']);
    expect(getColumnarPredicatePaths(predicate)).toEqual([['id'], ['address', 'city']]);
  });

  test('copies mutable predicate values without changing the expression shape', () => {
    const date = new Date('2025-01-01T00:00:00Z');
    const bytes = new Uint8Array([1, 2, 3]);
    const predicate = {op: '=', args: [{property: 'created_at'}, date]} as const;
    const copied = copyColumnarPredicate({
      op: 'and',
      args: [predicate, {op: '=', args: [{property: 'payload'}, bytes]}]
    });

    expect(copied).not.toBe(predicate);
    expect(copied).toEqual({
      op: 'and',
      args: [
        {op: '=', args: [{property: ['created_at']}, date]},
        {op: '=', args: [{property: ['payload']}, bytes]}
      ]
    });
    date.setUTCFullYear(2030);
    bytes[0] = 9;
    expect(copied.args[0].args[1]).toEqual(new Date('2025-01-01T00:00:00Z'));
    expect(copied.args[1].args[1]).toEqual(new Uint8Array([1, 2, 3]));
  });

  test('validates and evaluates predicates without materializing row objects', () => {
    const predicate = {
      op: 'and' as const,
      args: [
        {op: '>=', args: [{property: 'id'}, 2]} as const,
        {op: 'isNull', args: [{property: 'deleted_at'}]} as const
      ]
    };
    validateColumnarPredicate(predicate, new Set(['id', 'deleted_at']));
    expect(
      filterColumnarRowIndices(predicate, {id: [1, 2, 3], deleted_at: [null, null, 'x']}, 3)
    ).toEqual([1]);
    expect(
      gatherColumnarColumns(
        {id: [1, 2, 3], name: ['one', 'two', 'three']},
        [2, 0],
        new Set(['name'])
      )
    ).toEqual({name: ['three', 'one']});
    expect(() => validateColumnarPredicate(predicate, new Set(['id']))).toThrow(
      'column not found: deleted_at'
    );
    expect(() =>
      validateColumnarPredicate({op: 'in', args: [{property: 'id'}, []]}, new Set(['id']))
    ).toThrow('in requires at least one value');
  });
});
