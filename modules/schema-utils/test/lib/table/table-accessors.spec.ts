// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// TBA

// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {Table} from '@loaders.gl/schema';
import {
  getTableCell,
  getTableCellAt,
  getTableColumnIndex,
  getTableColumnName,
  getTableLength,
  getTableNumCols,
  getTableRowAsArray,
  getTableRowAsObject,
  getTableRowShape,
  isTable,
  makeRowIterator
} from '@loaders.gl/schema-utils';

type TestCase = {
  name: string;
  table: Table;
  isTable: boolean;
  numRows: number;
  numCols: number;
};

const TEST_CASES: TestCase[] = [
  {
    name: 'array row table (good)',
    table: {
      shape: 'array-row-table',
      data: [
        [1, 2, 3],
        [4, 5, 6]
      ]
    },
    isTable: true,
    numRows: 2,
    numCols: 3
  },
  {
    name: 'array row table (bad)',
    table: {
      shape: 'array-row-table',
      // @ts-expect-error intentionally wrong shape
      data: {a: [1, 2, 3], b: [4, 5, 6]}
    },
    isTable: false,
    numRows: 2,
    numCols: 3
  },
  {
    name: 'object row table (good)',
    table: {
      shape: 'object-row-table',
      data: [{a: 1, b: 2}]
    },
    isTable: true,
    numRows: 1,
    numCols: 2
  }
];

test('table accessors', () => {
  for (const tc of TEST_CASES) {
    expect(isTable(tc.table), `isTable() correct: ${tc.name}`).toBe(tc.isTable);
    if (isTable(tc.table)) {
      expect(getTableLength(tc.table), `getTableLength() correct: ${tc.name}`).toBe(tc.numRows);
      expect(getTableNumCols(tc.table), `getTableNumCols() correct: ${tc.name}`).toBe(tc.numCols);
    }
  }
});

test('accesses and converts rows across table shapes', () => {
  const schema = {fields: [{name: 'a'}, {name: 'b'}]};
  const arrayTable = {
    shape: 'array-row-table',
    schema,
    data: [
      [1, 2],
      [3, 4]
    ]
  } as Table;
  const objectTable = {shape: 'object-row-table', schema, data: [{a: 1, b: 2}]} as Table;
  const columnarTable = {shape: 'columnar-table', data: {a: [1], b: [2]}} as Table;
  const geojsonTable = {
    shape: 'geojson-table',
    schema,
    features: [{a: 1, b: 2}]
  } as Table;

  expect(getTableCell(arrayTable, 1, 'b')).toBe(4);
  expect(getTableCellAt(objectTable, 0, 1)).toBe(2);
  expect(getTableRowAsObject(arrayTable, 0)).toEqual({a: 1, b: 2});
  expect(getTableRowAsArray(objectTable, 0)).toEqual([1, 2]);
  expect(getTableRowAsObject(columnarTable, 0)).toEqual({a: 1, b: 2});
  expect(getTableRowAsArray(geojsonTable, 0)).toEqual([1, 2]);
  expect(getTableRowShape(arrayTable)).toBe('array-row-table');
  expect(getTableColumnIndex(arrayTable, 'b')).toBe(1);
  expect(getTableColumnName(arrayTable, 0)).toBe('a');
  expect([...makeRowIterator(arrayTable, 'array-row-table')]).toEqual([
    [1, 2],
    [3, 4]
  ]);
});

test('reports invalid table shapes and missing columns', () => {
  const emptyTable = {shape: 'array-row-table', data: []} as Table;

  expect(() => getTableNumCols(emptyTable)).toThrow('empty table');
  expect(() => getTableColumnIndex(emptyTable, 'missing')).toThrow('missing');
  expect(() => getTableColumnName(emptyTable, 0)).toThrow('0');
  expect(() => getTableRowShape({shape: 'columnar-table', data: {}} as Table)).toThrow(
    'Not a row table'
  );
});
