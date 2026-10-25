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

test('VTK legacy structured points preserve grid geometry and cell attributes', () => {
  const input = [
    '# vtk DataFile Version 3.0',
    'structured field',
    'ASCII',
    'DATASET STRUCTURED_POINTS',
    'DIMENSIONS 2 2 1',
    'ORIGIN -1 2 0',
    'SPACING 0.5 0.5 1',
    'CELL_DATA 1',
    'SCALARS density float',
    'LOOKUP_TABLE default',
    '7'
  ].join('\n');
  const dataset = parseVTKLegacy(input);
  expect(dataset.dimensions).toEqual([2, 2, 1]);
  expect(dataset.origin).toEqual([-1, 2, 0]);
  expect(dataset.spacing).toEqual([0.5, 0.5, 1]);
  expect(Array.from(dataset.cellData[0].data)).toEqual([7]);
});

test('VTK legacy polydata preserves polygon topology and normals', () => {
  const input = [
    '# vtk DataFile Version 3.0',
    'polygon',
    'ASCII',
    'DATASET POLYDATA',
    'POINTS 3 float',
    '0 0 0 1 0 0 0 1 0',
    'POLYGONS 1 4',
    '3 0 1 2',
    'POINT_DATA 3',
    'NORMALS normals float',
    '0 0 1 0 0 1 0 0 1'
  ].join('\n');
  const dataset = parseVTKLegacy(input);
  expect(Array.from(dataset.cells!.connectivity)).toEqual([0, 1, 2]);
  expect(dataset.pointData[0].components).toBe(3);
  expect(Array.from(dataset.pointData[0].data)).toEqual([0, 0, 1, 0, 0, 1, 0, 0, 1]);
});

test.each([
  ['missing header', 'not vtk\nname\nASCII\nDATASET POLYDATA', /invalid legacy header/],
  [
    'unsupported dataset',
    '# vtk DataFile Version 3.0\nname\nASCII\nDATASET FIELD',
    /unsupported dataset type/
  ],
  [
    'invalid dimensions',
    '# vtk DataFile Version 3.0\nname\nASCII\nDATASET STRUCTURED_POINTS\nDIMENSIONS 0 2 1',
    /invalid dimensions/
  ],
  [
    'truncated points',
    '# vtk DataFile Version 3.0\nname\nASCII\nDATASET POLYDATA\nPOINTS 1 float\n0 1',
    /truncated numeric data/
  ],
  [
    'missing attribute section',
    '# vtk DataFile Version 3.0\nname\nASCII\nDATASET POLYDATA\nSCALARS x float\nLOOKUP_TABLE default\n1',
    /SCALARS requires/
  ],
  [
    'unsupported keyword',
    '# vtk DataFile Version 3.0\nname\nASCII\nDATASET POLYDATA\nFIELD field',
    /unsupported keyword/
  ]
])('VTK legacy rejects %s', (_name, input, error) => {
  expect(() => parseVTKLegacy(input)).toThrow(error);
});
