// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {expect, test} from 'vitest';
import {getStructuralMetadataRow} from '@loaders.gl/3d-tiles';

test('getStructuralMetadataRow returns decoded columns with class defaults', () => {
  const propertyTable = {
    class: 'Building',
    count: 2,
    properties: {
      height: {values: 0, data: new Float64Array([12, 0])},
      name: {values: 0, data: ['A', 'B']}
    }
  } as any;
  const schemaClass = {
    properties: {
      height: {type: 'SCALAR', componentType: 'FLOAT64', noData: 0, default: 5},
      name: {type: 'STRING'}
    }
  } as any;

  expect(getStructuralMetadataRow(propertyTable, schemaClass, 0)).toEqual({
    height: 12,
    name: 'A'
  });
  expect(getStructuralMetadataRow(propertyTable, schemaClass, 1)).toEqual({
    height: 5,
    name: 'B'
  });
  expect(getStructuralMetadataRow(propertyTable, schemaClass, 2)).toBeNull();
});

test('getStructuralMetadataRow preserves vector and array values', () => {
  const vector = new Float32Array([1, 2, 3]);
  const propertyTable = {
    class: 'Sample',
    count: 1,
    properties: {
      vector: {values: 0, data: [vector]},
      tags: {values: 0, data: [['one', 'two']]}
    }
  } as any;

  const row = getStructuralMetadataRow(propertyTable, {properties: {}} as any, 0);
  expect(row?.vector).toBe(vector);
  expect(row?.tags).toEqual(['one', 'two']);
});

test('getStructuralMetadataRow slices flat vector columns and checks raw noData values', () => {
  const propertyTable = {
    class: 'Sample',
    count: 2,
    properties: {
      position: {
        values: 0,
        data: new Float64Array([10, 12, 4, 6]),
        rawData: new Uint8Array([0, 0, 1, 2])
      }
    }
  } as any;
  const schemaClass = {
    properties: {
      position: {
        type: 'VEC2',
        componentType: 'UINT8',
        noData: [0, 0],
        default: [99, 99]
      }
    }
  } as any;

  expect(getStructuralMetadataRow(propertyTable, schemaClass, 0)).toEqual({
    position: [99, 99]
  });
  expect(
    Array.from(getStructuralMetadataRow(propertyTable, schemaClass, 1)?.position as Float64Array)
  ).toEqual([4, 6]);
});

test('getStructuralMetadataRow handles typed-array array sentinels and omitted defaults', () => {
  const propertyTable = {
    class: 'Sample',
    count: 2,
    properties: {
      values: {
        values: 0,
        data: [new Float64Array([10, 12]), new Float64Array([2, 3])],
        rawData: [new Uint8Array([0, 0]), new Uint8Array([1, 2])]
      }
    }
  } as any;
  const schemaClass = {
    properties: {
      values: {
        type: 'SCALAR',
        componentType: 'UINT8',
        array: true,
        count: 2,
        noData: [0, 0],
        default: [7, 7]
      },
      classification: {type: 'STRING', default: 'unknown'}
    }
  } as any;

  expect(getStructuralMetadataRow(propertyTable, schemaClass, 0)).toEqual({
    values: [7, 7],
    classification: 'unknown'
  });
  expect(
    Array.from(getStructuralMetadataRow(propertyTable, schemaClass, 1)?.values as Float64Array)
  ).toEqual([2, 3]);
});
