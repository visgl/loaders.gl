// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {
  getArrowTableRowProperties,
  getBatchIndexFromLayerId,
  getSerializableArrowValue,
  isArrowTableBatch,
  isAsyncIterable
} from '../src/mesh-arrow-point-cloud-layer-utils';

test('Arrow tooltips read rows and ignore unavailable schema fields', () => {
  const table = arrow.tableFromArrays({name: ['one'], value: [1n]});
  expect(getArrowTableRowProperties(table, 0)).toEqual({name: 'one', value: 1n});
  const missingColumnTable = {
    schema: {fields: [{name: 'missing'}]},
    getChild: () => null
  } as unknown as arrow.Table;
  expect(getArrowTableRowProperties(missingColumnTable, 0)).toEqual({});
});

test('Arrow tooltips serialize bounded views and nested iterable values', () => {
  const bytes = new Uint8Array([99, 1, 2, 88]);
  expect(getSerializableArrowValue(new DataView(bytes.buffer, 1, 2))).toEqual([1, 2]);
  expect(getSerializableArrowValue([new Uint16Array([3, 4]), new Set([5, 6])])).toEqual([
    [3, 4],
    [5, 6]
  ]);
  expect(getSerializableArrowValue(null)).toBeNull();
  expect(getSerializableArrowValue({label: 'plain'})).toEqual({label: 'plain'});
});

test('Arrow batch and iterator guards reject incomplete layer input', () => {
  const data = arrow.tableFromArrays({value: [1]});
  expect(isArrowTableBatch({shape: 'arrow-table', batchType: 'data', data})).toBe(true);
  expect(isArrowTableBatch({shape: 'arrow-table', batchType: 'data', data: {}})).toBe(false);
  expect(isArrowTableBatch({shape: 'arrow-table', batchType: 'metadata', data})).toBe(false);
  expect(isArrowTableBatch(null)).toBe(false);
  expect(isAsyncIterable(null)).toBe(false);
  expect(isAsyncIterable({[Symbol.asyncIterator]: 1})).toBe(false);
  expect(isAsyncIterable({[Symbol.asyncIterator]: () => ({})})).toBe(true);
  expect(getBatchIndexFromLayerId('layer-points-12')).toBe(12);
  expect(getBatchIndexFromLayerId('layer-points-12-extra')).toBe(0);
  expect(getBatchIndexFromLayerId(undefined)).toBe(0);
});
