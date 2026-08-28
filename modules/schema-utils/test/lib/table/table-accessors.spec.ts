// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
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
  makeArrayRowIterator,
  makeObjectRowIterator,
  makeRowIterator
} from '@loaders.gl/schema-utils';
import {
  makeArrayRowTable,
  makeColumnarTable,
  makeObjectRowTable
} from '../../../src/lib/table/tables/table-accessors';

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

test('recognizes and measures every supported table shape', () => {
  const arrowData = arrow.tableFromArrays({a: [1, 2], b: ['x', 'y']});
  const tables = [
    {shape: 'array-row-table', data: [[1, 2]]},
    {shape: 'object-row-table', data: [{a: 1, b: 2}]},
    {shape: 'geojson-table', features: [{type: 'Feature', geometry: null, properties: {a: 1}}]},
    {shape: 'columnar-table', data: {a: [1, 2], b: ['x', 'y']}},
    {shape: 'arrow-table', data: arrowData}
  ] as Table[];

  expect(tables.map(table => isTable(table))).toEqual([true, true, true, true, true]);
  expect(tables.map(table => getTableLength(table))).toEqual([1, 1, 1, 2, 2]);
  expect(tables.map(table => getTableNumCols(table))).toEqual([2, 2, 3, 2, 2]);

  expect(isTable(null)).toBe(false);
  expect(isTable({shape: 'array-row-table', data: {}})).toBe(false);
  expect(isTable({shape: 'geojson-table', features: {}})).toBe(false);
  expect(isTable({shape: 'columnar-table', data: null})).toBe(false);
  expect(isTable({shape: 'arrow-table', data: {}})).toBe(false);
  expect(isTable({shape: 'unknown'})).toBe(false);
  expect(getTableLength({shape: 'columnar-table', data: {}} as Table)).toBe(0);

  const schemaTable = {
    shape: 'object-row-table',
    schema: {fields: [{name: 'only'}]},
    data: []
  } as Table;
  expect(getTableNumCols(schemaTable)).toBe(1);
});

test('accesses cells and rows for every table shape', () => {
  const schema = {fields: [{name: 'a'}, {name: 'b'}]};
  const arrowData = arrow.tableFromArrays({a: [1], b: [2]});
  const arrayTable = {shape: 'array-row-table', schema, data: [[1, 2]]} as Table;
  const objectTable = {shape: 'object-row-table', schema, data: [{a: 1, b: 2}]} as Table;
  const objectTableWithoutSchema = {
    shape: 'object-row-table',
    data: [{a: 1, b: 2}]
  } as Table;
  const geojsonTable = {
    shape: 'geojson-table',
    schema,
    features: [{a: 1, b: 2}]
  } as Table;
  const geojsonTableWithoutSchema = {
    shape: 'geojson-table',
    features: [{a: 1, b: 2}]
  } as Table;
  const columnarTable = {
    shape: 'columnar-table',
    schema,
    data: {a: [1], b: [2]}
  } as Table;
  const columnarTableWithoutSchema = {
    shape: 'columnar-table',
    data: {a: [1], b: [2]}
  } as Table;
  const arrowTable = {shape: 'arrow-table', data: arrowData} as Table;

  for (const table of [arrayTable, objectTable, geojsonTable, columnarTable, arrowTable]) {
    expect(getTableCell(table, 0, 'b')).toBe(2);
    expect(getTableCellAt(table, 0, 1)).toBe(2);
    expect(getTableRowAsObject(table, 0)).toEqual({a: 1, b: 2});
    expect(getTableRowAsArray(table, 0)).toEqual([1, 2]);
  }

  expect(getTableRowAsObject(objectTable, 0)).toBe(objectTable.data[0]);
  expect(getTableRowAsObject(objectTable, 0, undefined, 'copy')).not.toBe(objectTable.data[0]);
  expect(getTableRowAsArray(arrayTable, 0)).toBe(arrayTable.data[0]);
  expect(getTableRowAsArray(arrayTable, 0, undefined, 'copy')).not.toBe(arrayTable.data[0]);
  expect(getTableRowAsArray(objectTableWithoutSchema, 0)).toEqual([1, 2]);
  expect(getTableRowAsArray(geojsonTableWithoutSchema, 0)).toEqual([1, 2]);
  expect(getTableRowAsObject(columnarTableWithoutSchema, 0)).toEqual({a: 1, b: 2});
  expect(getTableRowAsArray(columnarTableWithoutSchema, 0)).toEqual([1, 2]);
  expect(getTableRowShape(objectTable)).toBe('object-row-table');
  expect(getTableRowShape(geojsonTable)).toBe('object-row-table');

  expect(() => getTableRowAsObject(objectTableWithoutSchema, 0)).not.toThrow();
  expect(() => getTableRowAsObject(arrayTable as Table, 0)).not.toThrow();
  expect(() => getTableRowAsObject({shape: 'array-row-table', data: [[1]]} as Table, 0)).toThrow(
    'no schema'
  );
  expect(() =>
    getTableRowAsObject({shape: 'geojson-table', features: [{a: 1}]} as Table, 0)
  ).toThrow('no schema');
});

test('converts tables and iterates rows in both row shapes', () => {
  const schema = {fields: [{name: 'a'}, {name: 'b'}]};
  const arrayTable = {
    shape: 'array-row-table',
    schema,
    data: [
      [1, 2],
      [3, 4]
    ]
  } as Table;
  const objectTable = {
    shape: 'object-row-table',
    schema,
    data: [
      {a: 1, b: 2},
      {a: 3, b: 4}
    ]
  } as Table;

  expect(makeArrayRowTable(arrayTable)).toBe(arrayTable);
  expect(makeObjectRowTable(objectTable)).toBe(objectTable);
  expect(makeColumnarTable(objectTable)).toBe(objectTable);
  expect(makeArrayRowTable(objectTable).data).toEqual([
    [1, 2],
    [3, 4]
  ]);
  expect(makeObjectRowTable(arrayTable).data).toEqual([
    {a: 1, b: 2},
    {a: 3, b: 4}
  ]);
  expect(makeColumnarTable(arrayTable).data).toEqual([
    {a: 1, b: 2},
    {a: 3, b: 4}
  ]);

  expect([...makeArrayRowIterator(objectTable)]).toEqual([
    [3, 4],
    [3, 4]
  ]);
  expect([...makeObjectRowIterator(arrayTable)]).toEqual([
    {a: 3, b: 4},
    {a: 3, b: 4}
  ]);
  expect([...makeRowIterator(objectTable, 'object-row-table')]).toEqual([
    {a: 1, b: 2},
    {a: 3, b: 4}
  ]);
  expect(() => [...makeRowIterator(arrayTable, 'unsupported' as never)]).toThrow(
    'Unknown row type unsupported'
  );
});

test('rejects invalid table variants in accessor switches', () => {
  const invalidTable = {shape: 'unsupported'} as unknown as Table;

  expect(() => getTableLength(invalidTable)).toThrow('table');
  expect(() => getTableNumCols(invalidTable)).toThrow('table');
  expect(() => getTableCell(invalidTable, 0, 'a')).toThrow('todo');
  expect(() => getTableCellAt(invalidTable, 0, 0)).toThrow('todo');
  expect(() => getTableRowAsObject(invalidTable, 0)).toThrow('shape');
  expect(() => getTableRowAsArray(invalidTable, 0)).toThrow('shape');
});
