// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {planColumnPages} from '../../src/parquetjs/encoder/page-planner';
import {ParquetSchema} from '../../src/parquetjs/schema/schema';

test('page planner splits flat columns at the configured value count', () => {
  const column = new ParquetSchema({value: {type: 'INT32'}}).fields.value;
  const pages = planColumnPages(
    column,
    {
      rlevels: [0, 0, 0, 0, 0],
      dlevels: [0, 0, 0, 0, 0],
      values: [10, 20, 30, 40, 50],
      count: 5,
      pageHeaders: []
    },
    5,
    2
  );

  expect(pages.map(page => page.rowCount)).toEqual([2, 2, 1]);
  expect(pages.map(page => page.data.values)).toEqual([[10, 20], [30, 40], [50]]);
});

test('page planner preserves repeated rows and their value alignment', () => {
  const column = new ParquetSchema({value: {type: 'INT32', repeated: true}}).fields.value;
  const pages = planColumnPages(
    column,
    {
      rlevels: [0, 1, 1, 0, 0, 1],
      dlevels: [1, 1, 1, 0, 1, 1],
      values: [10, 11, 12, 30, 31],
      count: 6,
      pageHeaders: []
    },
    3,
    2
  );

  expect(pages.map(page => page.rowCount)).toEqual([1, 1, 1]);
  expect(pages.map(page => page.data.count)).toEqual([3, 1, 2]);
  expect(pages.map(page => page.data.values)).toEqual([[10, 11, 12], [], [30, 31]]);
});

test('page planner rejects invalid sizes and inconsistent shredded rows', () => {
  const column = new ParquetSchema({value: {type: 'INT32'}}).fields.value;
  const data = {
    rlevels: [0],
    dlevels: [0],
    values: [1],
    count: 1,
    pageHeaders: []
  };

  expect(() => planColumnPages(column, data, 1, 0)).toThrow('positive integer');
  expect(() => planColumnPages(column, data, 2, 1)).toThrow('found 1 rows, expected 2');
});
