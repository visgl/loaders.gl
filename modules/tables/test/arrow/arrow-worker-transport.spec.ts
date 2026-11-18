// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Table, tableFromArrays} from 'apache-arrow';
import {
  serializeArrowTableResult,
  deserializeArrowTableResult
} from '../../src/arrow/lib/arrow-worker-transport';
import {GeoArrowLoaderWithParser} from '../../src/arrow/geoarrow-loader';
import type {ArrowLoaderOptions} from '../../src/arrow/arrow-loader-types';

test.each([
  [undefined, 'columnar-table'],
  [{}, 'columnar-table'],
  [{arrow: {shape: 'arrow'}}, 'arrow'],

  [{arrow: {shape: 'array-row-table'}}, 'array-row-table'],
  [{arrow: {shape: 'object-row-table'}}, 'object-row-table']
] as const)('Arrow column hydration honors options %j', (options, shape) => {
  const serialized = serializeArrowTableResult(tableFromArrays({id: new Int32Array([1])}));
  const result = deserializeArrowTableResult(serialized, options as ArrowLoaderOptions | undefined);
  if (result instanceof Table) {
    expect(shape).toBe('arrow');
    expect(result.getChild('id')?.get(0)).toBe(1);
    return;
  }
  expect(result.shape).toBe(shape);
  if (result.shape === 'array-row-table') {
    expect(result.data).toEqual([[1]]);
  } else if (result.shape === 'object-row-table') {
    expect(result.data).toEqual([{id: 1}]);
  } else {
    expect(result.data).toMatchObject({id: new Int32Array([1])});
  }
});

test.each([null, {}, {numRows: 1}])('Arrow serialization rejects malformed table %j', result => {
  expect(() => serializeArrowTableResult(result)).toThrow('Arrow table output');
});

test('GeoArrow hydration reads the native Arrow schema', () => {
  const table = tableFromArrays({id: new Int32Array([1])});
  const serialized = serializeArrowTableResult(table);
  expect(GeoArrowLoaderWithParser.deserializeWorkerResult(serialized)).toBeInstanceOf(Table);
  expect(() =>
    GeoArrowLoaderWithParser.deserializeWorkerResult(serialized, {arrow: {shape: 'geojson-table'}})
  ).toThrow('No GeoArrow geometry column found');
});
