// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {convertMeshToColumnarTable} from '../../../src/lib/mesh/convert-mesh-to-table';
import {getTypeInfo} from '../../../src/lib/table/arrow-api/get-type-info';
import {convertArrowToTable} from '../../../src/lib/table/tables/convert-arrow-table';
import {selectArrowTableRows} from '../../../src/lib/table/query-arrow-table';
import {
  getFixedSizeListData,
  getFixedSizeListType,
  getListFixedSizeListSize,
  getListFixedSizeListVector,
  isListFixedSizeList
} from '../../../src/lib/arrow-utils/arrow-list-of-fixed-size-list-utils';

test('Arrow utility adapters cover row selection and every table shape', () => {
  const data = arrow.tableFromArrays({name: ['a', 'b', 'c'], value: [1, 2, 3]});
  const wrapped = {shape: 'arrow-table', data} as const;
  const selected = selectArrowTableRows(wrapped, [2, 0], ['value'], 1);
  expect(selected.data.numRows).toBe(1);
  expect(selected.data.getChild('value')?.get(0)).toBe(3);
  expect(() => selectArrowTableRows(wrapped, [0], ['missing'])).toThrow(/could not read column/);

  expect(convertArrowToTable(data, 'arrow-table').shape).toBe('arrow-table');
  expect(convertArrowToTable(data, 'columnar-table').data.value).toBeInstanceOf(Float64Array);
  expect(convertArrowToTable(data, 'array-row-table').data).toHaveLength(3);
  expect(convertArrowToTable(data, 'object-row-table').data[0]).toMatchObject({name: 'a'});
  expect(convertArrowToTable(data, 'geojson-table').features).toHaveLength(3);
  expect(() => convertArrowToTable(data, 'invalid' as any)).toThrow('invalid');
});

test('fixed-size-list and Arrow type helpers expose native buffer metadata', () => {
  const values = new Float32Array([1, 2, 3, 4]);
  const data = getFixedSizeListData(values, 2);
  const type = getFixedSizeListType(values, 2);
  const vector = getListFixedSizeListVector(new Uint32Array([0, 1]), values, 2);

  expect(data.length).toBe(2);
  expect(type.listSize).toBe(2);
  expect(isListFixedSizeList(vector)).toBe(true);
  expect(getListFixedSizeListSize(vector)).toBe(2);
  expect(getListFixedSizeListSize(arrow.vectorFromArray([1, 2]))).toBe(1);
  expect(getTypeInfo(new arrow.Float64())).toMatchObject({typeName: 'Float64'});
  expect(getTypeInfo(new arrow.Int32()).typeEnumName).toBeTruthy();
});

test('mesh columnar conversion preserves attributes and optional indices', () => {
  const baseMesh = {
    shape: 'mesh',
    topology: 'triangle-list',
    mode: 4,
    schema: {fields: [], metadata: {}},
    attributes: {POSITION: {size: 3, value: new Float32Array([0, 0, 0])}}
  } as any;
  const withoutIndices = convertMeshToColumnarTable({...baseMesh, indices: null});
  const indices = {size: 1, value: new Uint16Array([0])};
  const withIndices = convertMeshToColumnarTable({...baseMesh, indices});

  expect(withoutIndices.data.POSITION).toBe(baseMesh.attributes.POSITION.value);
  expect(withoutIndices.indices).toBeUndefined();
  expect(withIndices.indices).toBe(indices);
});
