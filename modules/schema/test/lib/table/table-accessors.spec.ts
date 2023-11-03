// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

// TBA

// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {Table, getTableLength, getTableNumCols, isTable} from '@loaders.gl/schema';

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

test('table accessors', async (t) => {
  for (const tc of TEST_CASES) {
    t.equal(isTable(tc.table), tc.isTable, `isTable() correct: ${tc.name}`);
    if (isTable(tc.table)) {
      t.equal(getTableLength(tc.table), tc.numRows, `getTableLength() correct: ${tc.name}`);
      t.equal(getTableNumCols(tc.table), tc.numCols, `isTable() correct: ${tc.name}`);
    }
  }
  t.end();
});
