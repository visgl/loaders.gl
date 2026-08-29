// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {
  bindColumnarPredicateParameters,
  copyColumnarPredicate,
  filterColumnarRowIndices,
  gatherColumnarColumns,
  getColumnarPredicateColumns,
  getColumnarPredicateParameterNames,
  getColumnarPredicatePaths,
  isColumnarPredicateParameter,
  isColumnarPredicateValue,
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

  test('binds named parameters through logical, null, comparison, and in predicates', () => {
    const predicate = {
      op: 'and' as const,
      args: [
        {op: '>=', args: [{property: 'id'}, {parameter: 'minimum'}]} as const,
        {
          op: 'or' as const,
          args: [
            {op: 'in', args: [{property: 'name'}, ['one', {parameter: 'name'}]]} as const,
            {op: 'not', args: [{op: 'isNull', args: [{property: 'deleted'}]}]} as const
          ]
        }
      ]
    };

    expect(getColumnarPredicateParameterNames(predicate)).toEqual(['minimum', 'name']);
    const bound = bindColumnarPredicateParameters(predicate, {minimum: 2, name: 'two'});
    expect(getColumnarPredicateParameterNames(bound)).toEqual([]);
    expect(bound).toEqual({
      op: 'and',
      args: [
        {op: '>=', args: [{property: 'id'}, 2]},
        {
          op: 'or',
          args: [
            {op: 'in', args: [{property: 'name'}, ['one', 'two']]},
            {op: 'not', args: [{op: 'isNull', args: [{property: 'deleted'}]}]}
          ]
        }
      ]
    });
    expect(() => bindColumnarPredicateParameters(predicate, {})).toThrow('requires a value');
    expect(() =>
      bindColumnarPredicateParameters(predicate, {
        minimum: {parameter: 'other'} as never,
        name: 'two'
      })
    ).toThrow('cannot reference another parameter');
    expect(() =>
      bindColumnarPredicateParameters(predicate, {minimum: Number.NaN, name: 'two'})
    ).toThrow('unsupported value');
  });

  test('recognizes only portable predicate parameters and scalar values', () => {
    expect(isColumnarPredicateParameter({parameter: 'value'})).toBe(true);
    expect(isColumnarPredicateParameter({parameter: ''})).toBe(false);
    expect(isColumnarPredicateParameter({parameter: 'value', extra: true})).toBe(false);
    expect(isColumnarPredicateParameter([])).toBe(false);
    expect(isColumnarPredicateParameter(null)).toBe(false);

    for (const value of [true, 1, 1n, 'text', new Date(0), new Uint8Array([1])]) {
      expect(isColumnarPredicateValue(value)).toBe(true);
    }
    for (const value of [Infinity, new Date(Number.NaN), null, {}]) {
      expect(isColumnarPredicateValue(value)).toBe(false);
    }
  });

  test('evaluates every comparison and SQL-style three-valued logical branch', () => {
    const columns = {
      value: [1, 2, 3, null],
      nested: [{score: 2}, {score: 1}, null, {score: 4}],
      flag: [true, false, true, false]
    };
    const cases = [
      [{op: '=', args: [{property: 'value'}, 2]}, [1]],
      [{op: '<>', args: [{property: 'value'}, 2]}, [0, 2]],
      [{op: '<', args: [{property: 'value'}, 2]}, [0]],
      [{op: '<=', args: [{property: 'value'}, 2]}, [0, 1]],
      [{op: '>', args: [{property: 'value'}, 2]}, [2]],
      [{op: '>=', args: [{property: 'value'}, 2]}, [1, 2]],
      [{op: 'in', args: [{property: 'value'}, [1, 3]]}, [0, 2]],
      [{op: 'isNull', args: [{property: 'value'}]}, [3]],
      [{op: '=', args: [{property: ['nested', 'score']}, 2]}, [0]]
    ] as const;
    for (const [predicate, expected] of cases) {
      expect(filterColumnarRowIndices(predicate as any, columns, 4)).toEqual(expected);
    }

    expect(
      filterColumnarRowIndices(
        {
          op: 'or',
          args: [
            {op: '=', args: [{property: 'value'}, 1]},
            {op: '=', args: [{property: 'value'}, 3]}
          ]
        },
        columns,
        4
      )
    ).toEqual([0, 2]);
    expect(
      filterColumnarRowIndices(
        {op: 'not', args: [{op: '=', args: [{property: 'flag'}, true]}]},
        columns,
        4
      )
    ).toEqual([1, 3]);
    expect(filterColumnarRowIndices(undefined, columns, 4)).toEqual([0, 1, 2, 3]);
    expect(gatherColumnarColumns(columns, [1])).toEqual({
      value: [2],
      nested: [{score: 1}],
      flag: [false]
    });
  });

  test('compares dates and bytes and rejects incompatible runtime values', () => {
    expect(
      filterColumnarRowIndices(
        {op: '>', args: [{property: 'date'}, new Date(0)]},
        {date: [new Date(1)]},
        1
      )
    ).toEqual([0]);
    expect(
      filterColumnarRowIndices(
        {op: '<', args: [{property: 'bytes'}, new Uint8Array([2])]},
        {bytes: [new Uint8Array([1]), new Uint8Array([2, 0])]},
        2
      )
    ).toEqual([0]);
    expect(() =>
      filterColumnarRowIndices(
        {op: '=', args: [{property: 'bytes'}, new Uint8Array([1])]},
        {bytes: ['one']},
        1
      )
    ).toThrow('binary values on both sides');
    expect(() =>
      filterColumnarRowIndices({op: '=', args: [{property: 'date'}, new Date(0)]}, {date: [0]}, 1)
    ).toThrow('date values on both sides');
    expect(() =>
      filterColumnarRowIndices({op: '=', args: [{property: 'value'}, '1']}, {value: [1]}, 1)
    ).toThrow('cannot compare number with string');
    expect(() =>
      filterColumnarRowIndices(
        {op: '=', args: [{property: 'value'}, {} as never]},
        {value: [{}]},
        1
      )
    ).toThrow('does not support object values');
    expect(() =>
      filterColumnarRowIndices(
        {op: '>', args: [{property: 'date'}, new Date(Number.NaN)]},
        {date: [new Date(0)]},
        1
      )
    ).toThrow('Non-finite values');
  });

  test('validates logical arity, property paths, and available columns', () => {
    expect(() => validateColumnarPredicate({op: 'and', args: []}, new Set())).toThrow(
      'requires at least two child predicates'
    );
    expect(() =>
      validateColumnarPredicate({op: 'isNull', args: [{property: ['', 'child']}]}, new Set(['']))
    ).toThrow('non-empty strings');
    expect(() =>
      validateColumnarPredicate(
        {op: 'not', args: [{op: 'isNull', args: [{property: 'missing'}]}]},
        new Set()
      )
    ).toThrow('column not found');
  });
});
