// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {parseVTKLegacy} from '../../src/vtk';

test('VTK legacy ASCII unstructured geometry and point fields', () => {
  const input = [
    '# vtk DataFile Version 3.0',
    'synthetic triangle',
    'ASCII',
    'DATASET UNSTRUCTURED_GRID',
    'POINTS 3 float',
    '0 0 0 1 0 0 0 1 0',
    'CELLS 1 4',
    '3 0 1 2',
    'CELL_TYPES 1',
    '5',
    'POINT_DATA 3',
    'VECTORS velocity float',
    '1 0 0 0 1 0 0 0 1',
    'SCALARS temperature float 1',
    'LOOKUP_TABLE default',
    '10 20 30'
  ].join('\n');
  const dataset = parseVTKLegacy(input);
  expect(dataset.datasetType).toBe('UNSTRUCTURED_GRID');
  expect(Array.from(dataset.cells!.offsets)).toEqual([0, 3]);
  expect(Array.from(dataset.cells!.connectivity)).toEqual([0, 1, 2]);
  expect(Array.from(dataset.cells!.types!)).toEqual([5]);
  expect(Array.from(dataset.pointData[1].data)).toEqual([10, 20, 30]);
  expect(() => parseVTKLegacy(input.replace('ASCII', 'BINARY'))).toThrow(/only legacy ASCII/);
});
