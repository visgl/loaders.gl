// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  createTileGrid,
  createTileGridMatrix,
  getTileGridMatrixId,
  getTileGridValidation,
  validateTileGrid,
  validateTileGridLimits,
  resolveTileGridTile
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

test('shared validation distinguishes partial metadata, invalid geometry and empty coverage', () => {
  const partial = createTileGrid(undefined, [{id: 'native'}]);
  expect(getTileGridValidation(partial)).toMatchObject({status: 'partial'});
  expect(getTileGridValidation(partial).issues).toContainEqual(
    expect.objectContaining({
      code: 'missing-geometry',
      tileMatrix: 'native',
      message: expect.stringContaining('origin')
    })
  );
  expect(() => validateTileGrid(partial)).not.toThrow();
  const complete = createTileGrid('native', [createTileGridMatrix(FIELDS)]);
  expect(getTileGridValidation({...complete, limits: []})).toEqual({
    status: 'complete',
    issues: []
  });
  const duplicate = createTileGrid('native', [
    createTileGridMatrix(FIELDS),
    createTileGridMatrix(FIELDS)
  ]);
  expect(duplicate.tileMatrixSet).toBeUndefined();
  expect(getTileGridValidation(duplicate).issues).toContainEqual(
    expect.objectContaining({code: 'duplicate-matrix-id', tileMatrix: 'coarse'})
  );
  expect(() => validateTileGrid(duplicate)).toThrow('unique');
  expect(() => validateTileGrid({tileMatrixSet: {...complete.tileMatrixSet!, crs: ''}})).toThrow(
    'CRS'
  );
});

test.each([
  {id: ''},
  {resolution: 0},
  {resolutionY: Infinity},
  {tileSize: [0, 2]},
  {matrixSize: [2.5, 2]},
  {origin: [NaN, 0]},
  {cornerOfOrigin: 'sideways'},
  {cornerOfOrigin: null},
  {variableMatrixWidths: {}},
  {variableMatrixWidths: [{coalesce: 2, minTileRow: 0, maxTileRow: 0}]}
])('shared validation reports invalid advertised fields without discarding them: %j', replacement => {
  const matrix = {...createTileGridMatrix(FIELDS), ...replacement} as any;
  const grid = createTileGrid('native', [matrix]);
  expect(grid.matrices?.[0]).toBe(matrix);
  expect(getTileGridValidation(grid).status).toBe('invalid');
  expect(() => validateTileGrid(grid)).toThrow(RangeError);
});

test('limits are validated for partial grids and for all complete levels', () => {
  const limit = {
    tileMatrix: 'coarse',
    minTileColumn: 0,
    maxTileColumn: 0,
    minTileRow: 0,
    maxTileRow: 0
  };
  const grid = createTileGrid(undefined, [{id: 'coarse', matrixSize: [3, 2]}]);
  expect(() => validateTileGridLimits({...grid, limits: [limit]})).not.toThrow();
  for (const limits of [
    [{...limit, tileMatrix: 'missing'}],
    [{...limit, maxTileColumn: 3}],
    [{...limit, minTileRow: 1}],
    [limit, limit],
    [null],
    {}
  ]) {
    expect(getTileGridValidation({...grid, limits: limits as any}).status).toBe('invalid');
  }
  const complete = createTileGrid('native', [createTileGridMatrix(FIELDS)]);
  expect(
    getTileGridValidation({...complete, limits: [{...limit, maxTileRow: 2}]}).issues
  ).toContainEqual(expect.objectContaining({code: 'invalid-limits'}));
});

test.each([
  'topLeft',
  'bottomLeft'
] as const)('normalization and addressing preserve coalesced %s rows and covered aliases', cornerOfOrigin => {
  const matrix = createTileGridMatrix({
    ...FIELDS,
    matrixWidth: 4,
    cornerOfOrigin,
    swapAxes: true,
    variableMatrixWidths: [{coalesce: 2, minTileRow: 0, maxTileRow: 0}]
  });
  const grid = {
    ...createTileGrid('native', [matrix]),
    limits: [
      {tileMatrix: 'coarse', minTileColumn: 1, maxTileColumn: 1, minTileRow: 0, maxTileRow: 0}
    ]
  };
  expect(grid.tileMatrixSet!.matrices[0].variableMatrixWidths).toEqual(matrix.variableMatrixWidths);
  expect(grid.tileMatrixSet!.matrices[0].origin).toEqual([200, 100]);
  const signal = new AbortController().signal;
  for (const x of [0, 1])
    expect(resolveTileGridTile(grid, {z: 0, x, y: 0, signal})).toEqual({
      z: 0,
      x: 0,
      y: 0,
      signal,
      tileMatrix: 'coarse'
    });
  expect(resolveTileGridTile(grid, {z: 0, x: 2, y: 0})).toBeNull();
  expect(resolveTileGridTile(grid, {z: 0, x: 1, y: 1})).toBeNull();
  expect(resolveTileGridTile({...grid, limits: []}, {z: 0, x: 0, y: 0})).toBeNull();
});

test('partial addressing remains usable but coalesced requests require complete geometry', () => {
  const request = {z: 0, x: 1, y: 0};
  expect(resolveTileGridTile(undefined, request)).toBe(request);
  expect(() => resolveTileGridTile(undefined, {...request, x: -1})).toThrow('safe integers');
  const grid = createTileGrid(undefined, [{id: 'coarse', matrixSize: [4, 2]}]);
  expect(resolveTileGridTile(grid, request)?.tileMatrix).toBe('coarse');
  expect(resolveTileGridTile(grid, {...request, z: 9})).toBeNull();
  expect(resolveTileGridTile(grid, {...request, x: 4})).toBeNull();
  expect(() => resolveTileGridTile(grid, {...request, tileMatrix: 'missing'})).toThrow('Unknown');
  const partial = {
    ...grid,
    matrices: [
      {...grid.matrices![0], variableMatrixWidths: [{coalesce: 2, minTileRow: 0, maxTileRow: 0}]}
    ]
  };
  expect(getTileGridValidation(partial).status).toBe('partial');
  expect(() => resolveTileGridTile(partial, request)).toThrow('complete geometry');
});

test('invalid authoritative sets cannot borrow missing geometry or CRS from legacy fields', () => {
  const grid = createTileGrid('native', [createTileGridMatrix(FIELDS)]);
  const missingMatrices = {...grid, tileMatrixSet: {crs: 'native'} as any};
  expect(getTileGridValidation(missingMatrices).status).toBe('invalid');
  expect(() => validateTileGrid(missingMatrices)).toThrow('array');
  const missingCoordinateReferenceSystem = {
    ...grid,
    tileMatrixSet: {matrices: grid.tileMatrixSet!.matrices} as any
  };
  expect(() => validateTileGrid(missingCoordinateReferenceSystem)).toThrow('CRS');
});
