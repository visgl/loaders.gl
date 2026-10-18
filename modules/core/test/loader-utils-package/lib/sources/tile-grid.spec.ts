// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  createTileGrid,
  createTileGridMatrix,
  getTileGridMatrixId
} from '@loaders.gl/core/loader-utils';
import {getTileBounds} from '@math.gl/geospatial';

const FIELDS = {
  id: 'coarse',
  resolution: 2,
  resolutionY: 3,
  point: [100, 200],
  swapAxes: false,
  tileWidth: 4,
  tileHeight: 2,
  matrixWidth: 3,
  matrixHeight: 2
};

test('shared grid normalization preserves both pixel resolutions and complete geometry', () => {
  const matrix = createTileGridMatrix(FIELDS);
  const grid = createTileGrid('EPSG:3857', [matrix]);
  expect(grid.tileMatrixSet?.matrices[0].resolutionY).toBe(3);
  expect(getTileBounds(grid.tileMatrixSet!.matrices[0], 1, 1)).toEqual([108, 188, 116, 194]);
  expect(grid.matrixSizes).toEqual([[3, 2]]);
  expect(grid.resolutions).toEqual([2]);
  const bottom = createTileGrid('EPSG:3857', [
    createTileGridMatrix({...FIELDS, cornerOfOrigin: 'bottomLeft', swapAxes: true})
  ]);
  expect(bottom.origin).toBeUndefined();
  expect(bottom.tileMatrixSet?.matrices[0].origin).toEqual([200, 100]);
});

test('partial and invalid levels never become complete geometry', () => {
  const partial = createTileGridMatrix({id: 'partial', swapAxes: false, tileWidth: 256});
  expect(partial.tileSize).toBeUndefined();
  expect(createTileGrid('EPSG:3857', [partial]).tileMatrixSet).toBeUndefined();
  expect(createTileGrid(undefined, [createTileGridMatrix(FIELDS)]).tileMatrixSet).toBeUndefined();
  expect(createTileGrid('EPSG:3857', []).matrixIds).toEqual([]);
  const invalid = createTileGrid('EPSG:3857', [createTileGridMatrix({...FIELDS, resolutionY: 0})]);
  expect(invalid.tileMatrixSet).toBeUndefined();
  expect(invalid.matrices?.[0].resolutionY).toBe(0);
  expect(
    createTileGrid('EPSG:3857', [{id: 'a', cornerOfOrigin: 'bottomLeft', origin: [0, 0]}]).origin
  ).toBeUndefined();
});

test('shared addressing preserves exact ids, numeric-id priority, and index fallback', () => {
  const grid = createTileGrid(undefined, [{id: 'coarse'}, {id: '0'}]);
  expect(getTileGridMatrixId(grid, {z: 0})).toBe('0');
  expect(getTileGridMatrixId(grid, {z: 1, tileMatrix: 'coarse'})).toBe('coarse');
  expect(getTileGridMatrixId(createTileGrid(undefined, [{id: 'coarse'}]), {z: 0})).toBe('coarse');
  expect(() => getTileGridMatrixId(grid, {z: 3})).toThrow('No tile matrix');
  expect(() => getTileGridMatrixId(grid, {z: 0, tileMatrix: 'missing'})).toThrow(
    'Unknown tile matrix'
  );
  expect(getTileGridMatrixId(undefined, {z: 3})).toBe('3');
  expect(getTileGridMatrixId(undefined, {z: 3, tileMatrix: 'named'})).toBe('named');
});
