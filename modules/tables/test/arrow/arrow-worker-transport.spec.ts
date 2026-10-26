// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Table, tableFromArrays} from 'apache-arrow';
import {
  serializeArrowIPCResult,
  deserializeArrowIPCResult
} from '../../src/arrow/lib/arrow-worker-transport';
import {GeoArrowLoaderWithParser} from '../../src/arrow/geoarrow-loader';
import type {ArrowLoaderOptions} from '../../src/arrow/exports/arrow-loader';

test.each([
  [undefined, 'columnar-table'],
  [{}, 'columnar-table'],
  [{arrow: {shape: 'arrow-table'}}, 'arrow-table'],
  [{arrow: {shape: 'array-row-table'}}, 'array-row-table']
] as const)('Arrow IPC hydration honors options %j', (options, shape) => {
  const serialized = serializeArrowIPCResult({
    shape: 'arrow-table',
    data: tableFromArrays({id: new Int32Array([1])})
  });
  const result = deserializeArrowIPCResult(serialized, options as ArrowLoaderOptions | undefined);
  expect(result.shape).toBe(shape);
  if (result.shape === 'arrow-table') {
    expect(result.data).toBeInstanceOf(Table);
    expect(result.data.getChild('id')?.get(0)).toBe(1);
  } else if (result.shape === 'array-row-table') {
    expect(result.data).toEqual([[1]]);
  } else {
    expect(result.data).toMatchObject({id: new Int32Array([1])});
  }
});

test.each([
  null,
  {shape: 'arrow-table'},
  {shape: 'arrow-table', data: {}}
])('Arrow serialization rejects malformed table %j', result => {
  expect(() => serializeArrowIPCResult(result)).toThrow('Arrow table output');
});

test('GeoArrow hydration requires wrapper schema only when materializing features', () => {
  const serialized = serializeArrowIPCResult({
    shape: 'arrow-table',
    data: tableFromArrays({id: new Int32Array([1])})
  });
  expect(GeoArrowLoaderWithParser.deserializeWorkerResult(serialized).data).toBeInstanceOf(Table);
  expect(GeoArrowLoaderWithParser.deserializeWorkerResult(serialized, {}).data).toBeInstanceOf(
    Table
  );
  expect(() =>
    GeoArrowLoaderWithParser.deserializeWorkerResult(serialized, {arrow: {shape: 'geojson-table'}})
  ).toThrow('Arrow table is missing its schema');
});
