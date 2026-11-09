// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {normalizeTableQuery, planLogicalTableQuery} from '../../../../src/loader-utils';
import type {TableQuery} from '../../../../src/loader-utils';

const columns = ['longitude', 'latitude', 'population'];

test('logical plans retain hidden predicate columns and ordered alias mappings', () => {
  const where = {op: '>' as const, args: [{property: 'population'}, 100] as const};
  const query = Object.freeze({
    select: Object.freeze([{column: 'latitude', as: 'lat'}, 'longitude']),
    where,
    limit: 0
  });
  expect(planLogicalTableQuery(columns, query)).toEqual([
    {kind: 'scan', columns},
    {kind: 'filter', predicate: where},
    {
      kind: 'project',
      select: [
        {column: 'latitude', as: 'lat'},
        {column: 'longitude', as: 'longitude'}
      ]
    },
    {kind: 'limit', limit: 0}
  ]);
  expect(query.select).toEqual([{column: 'latitude', as: 'lat'}, 'longitude']);
});

test('normalization expands defaults and permits distinct aliases of one source column', () => {
  expect(normalizeTableQuery(columns).select).toEqual(
    columns.map(column => ({column, as: column}))
  );
  const normalized = normalizeTableQuery(columns, {
    select: [
      {column: 'longitude', as: 'a'},
      {column: 'longitude', as: 'b'}
    ]
  });
  expect(planLogicalTableQuery(columns, normalized)[0]).toEqual({
    kind: 'scan',
    columns: ['longitude']
  });
  expect(Object.isFrozen(normalized.select)).toBe(true);
  expect(Object.isFrozen(normalized.select[0])).toBe(true);
  expect(normalizeTableQuery([], {}).select).toEqual([]);
});

test.each([
  [{select: []}, /non-empty array/],
  [{select: ['missing']}, /column not found/],
  [{select: ['latitude', {column: 'longitude', as: 'latitude'}]}, /Duplicate/],
  [{select: [{column: 'longitude', as: ''}]}, /non-empty string/],
  [{select: [null]}, /selection must/],
  [{select: [{column: 'longitude', expression: 'x'}]}, /Unsupported/],
  [{select: 'longitude'}, /non-empty array/],
  [{limit: -1}, /non-negative/],
  [{limit: 1.5}, /safe integer/],
  [{limit: Infinity}, /safe integer/],
  [{signal: {}}, /Unsupported/],
  [
    {where: {op: '>', args: [{property: 'lng'}, 1]}, select: [{column: 'longitude', as: 'lng'}]},
    /lng/
  ],
  [null, /must be an object/]
])('rejects invalid logical query %j', (query, message) => {
  expect(() => normalizeTableQuery(columns, query as unknown as TableQuery)).toThrow(message);
});

test('WHERE resolves original names even when another column aliases to that name', () => {
  const where = {op: '>' as const, args: [{property: 'population'}, 10] as const};
  const plan = planLogicalTableQuery(columns, {
    select: [{column: 'longitude', as: 'population'}],
    where
  });
  expect(plan[0]).toEqual({kind: 'scan', columns: ['longitude', 'population']});
  expect(plan[1]).toEqual({kind: 'filter', predicate: where});
});
