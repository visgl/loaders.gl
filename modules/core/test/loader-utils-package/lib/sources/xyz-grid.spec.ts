// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {createWebMercatorTileGrid, resolveXYZTileParameters} from '@loaders.gl/core/loader-utils';
import {getTileBounds} from '@math.gl/geospatial';

test('Canonical XYZ geometry preserves zoom IDs and logical pixel density', () => {
  const grid = createWebMercatorTileGrid(3, 4, 512);
  expect(grid.matrixIds).toEqual(['3', '4']);
  expect(grid.matrixSizes).toEqual([
    [8, 8],
    [16, 16]
  ]);
  expect(grid.tileSize).toEqual([512, 512]);
  const matrix = grid.tileMatrixSet!.matrices[0];
  const bounds = getTileBounds(matrix, 0, 0);
  expect(bounds[0]).toBeCloseTo(-20037508.342789244);
  expect(bounds[3]).toBeCloseTo(20037508.342789244);
  expect(matrix.resolution).toBeCloseTo(40075016.68557849 / (8 * 512));
  expect(grid.limits).toBeUndefined();
});

test.each([
  [-1, 3, 256],
  [2, 1, 256],
  [0, 32, 256],
  [0.5, 2, 256],
  [0, 2, 0],
  [0, 2, NaN]
])('Reject invalid XYZ grid %j', (minimum, maximum, size) => {
  expect(() => createWebMercatorTileGrid(minimum, maximum, size)).toThrow(RangeError);
});

test('XYZ request resolution keeps IDs ahead of index fallback and validates world coordinates', () => {
  const grid = createWebMercatorTileGrid(3, 5);
  expect(resolveXYZTileParameters(grid, {z: 3, x: 1, y: 2})?.z).toBe(3);
  expect(resolveXYZTileParameters(grid, {z: 0, x: 1, y: 2})?.z).toBe(3);
  expect(resolveXYZTileParameters(grid, {z: 0, x: 1, y: 2, tileMatrix: '5'})?.z).toBe(5);
  expect(() => resolveXYZTileParameters(grid, {z: 0, x: 0, y: 0, tileMatrix: '03'})).toThrow(
    /Unknown/
  );
  for (const parameters of [
    {z: 9, x: 0, y: 0},
    {z: 3, x: 8, y: 0},
    {z: 3, x: 0, y: -1},
    {z: 3, x: 0.5, y: 0}
  ]) {
    expect(resolveXYZTileParameters(grid, parameters)).toBeNull();
  }
  expect(resolveXYZTileParameters(undefined, {z: 3, x: 0, y: 0})).toEqual({z: 3, x: 0, y: 0});
  expect(() => resolveXYZTileParameters(undefined, {z: 0, x: 0, y: 0, tileMatrix: 'x'})).toThrow(
    /established/
  );
});

test('XYZ resolution rejects non-XYZ or incomplete matrix metadata', () => {
  for (const matrix of [{id: 'custom'}, {id: '3'}, {id: '3', matrixSize: [3, 3]}]) {
    expect(() => resolveXYZTileParameters({matrices: [matrix as any]}, {z: 0, x: 0, y: 0})).toThrow(
      /canonical zoom/
    );
  }
});

test('XYZ zoom 31 retains unsigned dimensions and boundary indices', () => {
  const grid = createWebMercatorTileGrid(31, 31);
  expect(grid.tileMatrixSet?.matrices[0].matrixSize).toEqual([2147483648, 2147483648]);
  expect(
    resolveXYZTileParameters(grid, {z: 0, x: 2147483647, y: 2147483647, tileMatrix: '31'})?.z
  ).toBe(31);
  expect(resolveXYZTileParameters(grid, {z: 31, x: 2147483648, y: 0})).toBeNull();
});

test('XYZ addressing rejects coalescence in authoritative or advertised metadata', () => {
  const bands = [{coalesce: 2, minTileRow: 0, maxTileRow: 0}];
  const grid = createWebMercatorTileGrid(1, 1);
  expect(() =>
    resolveXYZTileParameters(
      {
        tileMatrixSet: {
          ...grid.tileMatrixSet!,
          matrices: [{...grid.tileMatrixSet!.matrices[0], variableMatrixWidths: bands}]
        }
      },
      {z: 1, x: 1, y: 0}
    )
  ).toThrow('coalesced');
  expect(() =>
    resolveXYZTileParameters(
      {...grid, matrices: [{...grid.matrices![0], variableMatrixWidths: bands}]},
      {z: 1, x: 1, y: 0}
    )
  ).toThrow('coalesced');
  expect(() =>
    resolveXYZTileParameters(
      {
        ...grid,
        tileMatrixSet: {
          ...grid.tileMatrixSet!,
          matrices: [{...grid.tileMatrixSet!.matrices[0], variableMatrixWidths: bands}]
        }
      },
      {z: 1, x: 1, y: 0}
    )
  ).toThrow('coalesced');
});
