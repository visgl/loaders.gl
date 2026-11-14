// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {describe, expect, test} from 'vitest';
import {queryArrowTable} from '../../../../src/schema-utils/lib/table/query-arrow-table';

describe('queryArrowTable', () => {
  test('preserves the native Arrow schema', () => {
    const table = arrow.tableFromArrays({id: [1, 2]});
    const result = queryArrowTable(table);
    expect(result.schema?.fields.map(field => field.name)).toEqual(['id']);
    expect(result.numRows).toBe(2);
  });

  test('projects and limits an Arrow table', () => {
    const table = arrow.tableFromArrays({id: [1, 2], name: ['a', 'b']});
    const result = queryArrowTable(table, {columns: ['name'], limit: 1});
    expect(result.schema.fields.map(field => field.name)).toEqual(['name']);
    expect(result.toArray().map(row => ({...row}))).toEqual([{name: 'a'}]);
  });

  test('evaluates predicates against unprojected columns', () => {
    const table = arrow.tableFromArrays({id: [1, 2, 3], name: ['a', 'b', 'c']});
    table.schema.metadata.set('source', 'fixture');
    table.schema.fields[1].metadata.set('role', 'name');
    const result = queryArrowTable(
      table,
      {predicate: {kind: 'filter'} as {kind: string}, columns: ['name']},
      (_predicate, columns) =>
        columns.id
          .map((value, index) => ((value as number) > 1 ? index : -1))
          .filter(index => index >= 0)
    );
    expect(result.toArray().map(row => ({...row}))).toEqual([{name: 'b'}, {name: 'c'}]);
    expect(result.schema.metadata.get('source')).toBe('fixture');
    expect(result.schema.fields[0].metadata.get('role')).toBe('name');
  });

  test('rejects unknown projected columns and missing evaluators', () => {
    const table = arrow.tableFromArrays({id: [1]});
    expect(() => queryArrowTable(table, {columns: ['missing']})).toThrow(/missing/);
    expect(() => queryArrowTable(table, {predicate: {kind: 'filter'}})).toThrow(/evaluator/);
  });
});
