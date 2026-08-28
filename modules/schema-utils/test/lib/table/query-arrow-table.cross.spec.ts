// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {describe, expect, test} from 'vitest';
import {queryArrowTable} from '../../../src/lib/table/query-arrow-table';

describe('queryArrowTable', () => {
  test('preserves and projects the portable schema', () => {
    const table = {
      shape: 'arrow-table' as const,
      schema: {fields: [{name: 'id', type: 'int32', nullable: false}]},
      data: arrow.tableFromArrays({id: [1, 2]})
    };
    const result = queryArrowTable(table);
    expect(result.schema?.fields.map(field => field.name)).toEqual(['id']);
    expect(result.data.numRows).toBe(2);
  });

  test('projects and limits an Arrow table', () => {
    const table = {
      shape: 'arrow-table' as const,
      data: arrow.tableFromArrays({id: [1, 2], name: ['a', 'b']})
    };
    const result = queryArrowTable(table, {columns: ['name'], limit: 1});
    expect(result.data.schema.fields.map(field => field.name)).toEqual(['name']);
    expect(result.data.toArray().map(row => ({...row}))).toEqual([{name: 'a'}]);
  });

  test('evaluates predicates against unprojected columns', () => {
    const table = {
      shape: 'arrow-table' as const,
      data: arrow.tableFromArrays({id: [1, 2, 3], name: ['a', 'b', 'c']})
    };
    const result = queryArrowTable(
      table,
      {predicate: {kind: 'filter'} as {kind: string}, columns: ['name']},
      (_predicate, columns) =>
        columns.id
          .map((value, index) => ((value as number) > 1 ? index : -1))
          .filter(index => index >= 0)
    );
    expect(result.data.toArray().map(row => ({...row}))).toEqual([{name: 'b'}, {name: 'c'}]);
  });

  test('rejects unknown projected columns and missing evaluators', () => {
    const table = {shape: 'arrow-table' as const, data: arrow.tableFromArrays({id: [1]})};
    expect(() => queryArrowTable(table, {columns: ['missing']})).toThrow(/missing/);
    expect(() => queryArrowTable(table, {predicate: {kind: 'filter'}})).toThrow(/evaluator/);
  });
});
