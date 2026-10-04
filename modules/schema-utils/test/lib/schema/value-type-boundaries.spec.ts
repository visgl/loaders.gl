// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataType, Table} from '@loaders.gl/schema';
import {describe, expect, test} from 'vitest';
import {
  getArrayTypeFromDataType,
  getDataTypeFromArray,
  getDataTypeFromTypedArray,
  getDataTypeFromValue
} from '../../../src/lib/schema/data-type';
import {deduceSchema, deduceTableSchema} from '../../../src/lib/schema/deduce-table-schema';
import {
  convertToArrayRow,
  convertToObjectRow,
  inferHeadersFromArrayRow,
  inferHeadersFromObjectRow
} from '../../../src/lib/table/tables/row-utils';

describe('schema scalar and storage boundaries', () => {
  test.each([
    [new Date(0), 'date-millisecond'],
    [false, 'bool'],
    [0, 'float32'],
    ['', 'utf8'],
    [null, 'null'],
    [undefined, 'null'],
    [{nested: true}, 'null']
  ])('deduces %j as %s', (value, type) => {
    expect(getDataTypeFromValue(value)).toBe(type);
  });

  test.each([
    ['int8', Int8Array],
    ['uint8', Uint8Array],
    ['int16', Int16Array],
    ['uint16', Uint16Array],
    ['int32', Int32Array],
    ['uint32', Uint32Array],
    ['float32', Float32Array],
    ['float64', Float64Array]
  ] as const)('selects %s storage only for non-nullable columns', (type, ArrayConstructor) => {
    expect(getArrayTypeFromDataType(type, false)).toBe(ArrayConstructor);
    expect(getArrayTypeFromDataType(type, true)).toBe(Array);
    expect(getDataTypeFromTypedArray(new ArrayConstructor(1))).toBe(type);
  });

  test('handles empty, nullable, clamped, and bigint arrays', () => {
    expect(getDataTypeFromArray([])).toEqual({type: 'null', nullable: true});
    expect(getDataTypeFromArray([false])).toEqual({type: 'bool', nullable: true});
    expect(getDataTypeFromArray(new Uint8ClampedArray(0))).toEqual({
      type: 'uint8',
      nullable: false
    });
    expect(getDataTypeFromTypedArray(new BigInt64Array(0))).toBe('int64');
    expect(getDataTypeFromTypedArray(new BigUint64Array(0))).toBe('uint64');
    expect(getArrayTypeFromDataType('utf8', false)).toBe(Array);
    expect(getArrayTypeFromDataType('int64', false)).toBe(Array);
    const halfStorage = getArrayTypeFromDataType('float16', false);
    expect(new halfStorage(2)).toHaveLength(2);
  });

  test('deduces column nullability and rejects empty untyped columns', () => {
    expect(
      deduceTableSchema({
        shape: 'columnar-table',
        data: {values: new Uint16Array(0), labels: ['x']}
      })
    ).toEqual({
      fields: [
        {name: 'values', type: 'uint16', nullable: false},
        {name: 'labels', type: 'utf8', nullable: true}
      ],
      metadata: {}
    });
    expect(() => deduceSchema({empty: []})).toThrow('empty table');
    expect(() => deduceSchema([])).toThrow('deduce from empty table');
  });

  test('GeoJSON deduction handles null properties and empty features', () => {
    expect(
      deduceTableSchema({
        shape: 'geojson-table',
        type: 'FeatureCollection',
        features: [
          {type: 'Feature', geometry: {type: 'Point', coordinates: [0, 0]}, properties: null}
        ]
      })
    ).toEqual({fields: [], metadata: {}});
    expect(
      deduceTableSchema({
        shape: 'geojson-table',
        type: 'FeatureCollection',
        features: [
          {type: 'Feature', geometry: {type: 'Point', coordinates: [0, 0]}, properties: {id: 0}}
        ]
      })
    ).toEqual({fields: [{name: 'id', type: 'float32', nullable: true}], metadata: {}});
    expect(() =>
      deduceTableSchema({shape: 'geojson-table', type: 'FeatureCollection', features: []})
    ).toThrow('deduce from empty table');
    expect(() => deduceTableSchema({shape: 'arrow-table'} as Table)).toThrow('Deduce schema');
  });
});

test('row adapters preserve nested values and explicit header ordering', () => {
  const nested = {list: [1, null], object: {name: 'nested'}};
  expect(convertToObjectRow([nested, false], null)).toEqual({
    'column-0': nested,
    'column-1': false
  });
  expect(convertToArrayRow({second: false, first: nested}, ['first', 'missing', 'second'])).toEqual(
    [nested, undefined, false]
  );
  expect(convertToArrayRow({first: nested, second: false}, null)).toEqual([nested, false]);
  expect(convertToObjectRow([nested], ['first', 'missing'])).toEqual({
    first: nested,
    missing: undefined
  });
  expect(inferHeadersFromArrayRow([nested, null])).toEqual(['column-0', 'column-1']);
  expect(inferHeadersFromObjectRow({first: nested, second: null})).toEqual(['first', 'second']);
  expect(() => convertToObjectRow(null as unknown as unknown[], null)).toThrow('null row');
  expect(() => convertToArrayRow(null as unknown as Record<string, unknown>, null)).toThrow(
    'null row'
  );
  expect(getArrayTypeFromDataType({type: 'struct', children: []} as DataType, false)).toBe(Array);
});
