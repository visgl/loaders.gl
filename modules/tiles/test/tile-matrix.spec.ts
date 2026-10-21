// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {TileGrid} from '@loaders.gl/core/loader-utils';
import type {TileMatrix} from '@math.gl/geospatial/tile-matrix';
import {selectTileMatrixTiles} from '../src/tile-matrix';

/** Small regular matrices with opaque native identifiers, deliberately not sorted by resolution. */
const MATRIX: TileMatrix = {
  id: 'native/detail',
  resolution: 2,
  resolutionY: 3,
  origin: [100, 200],
  cornerOfOrigin: 'topLeft',
  tileSize: [10, 5],
  matrixSize: [3, 2]
};
/** Complete projected grid; numeric compatibility z is only the selected array position. */
const GRID: TileGrid = {
  tileMatrixSet: {
    crs: 'EPSG:32631',
    matrices: [MATRIX, {...MATRIX, id: '1', resolution: 4, resolutionY: 6}]
  }
};
/** A frame spanning the small grid in native coordinate units. */
const FRAME = {crs: 'EPSG:32631', extent: [100, 170, 160, 200] as const, resolution: 3};

test('selects native ids, rectangular pixels and stable identities independently of array order', () => {
  const tiles = selectTileMatrixTiles(GRID, FRAME);
  expect(tiles).toHaveLength(6);
  expect(tiles[1]).toEqual({
    index: {x: 1, y: 0, z: 0},
    tileMatrix: 'native/detail',
    id: JSON.stringify(['EPSG:32631', 'native/detail', 1, 0]),
    bbox: {left: 120, bottom: 185, right: 140, top: 200},
    crs: 'EPSG:32631',
    tileSize: [10, 5]
  });
  const reordered = {
    ...GRID,
    tileMatrixSet: {...GRID.tileMatrixSet!, matrices: [...GRID.tileMatrixSet!.matrices].reverse()}
  };
  const same = selectTileMatrixTiles(reordered, FRAME);
  expect(same[1].index.z).toBe(1);
  expect(same[1].id).toBe(tiles[1].id);
  expect(selectTileMatrixTiles(GRID, {...FRAME, resolution: 6})[0].tileMatrix).toBe('1');
  expect(selectTileMatrixTiles(GRID, {...FRAME, resolution: 0.1})[0].tileMatrix).toBe(
    'native/detail'
  );
});

test.each([
  'topLeft',
  'bottomLeft'
] as const)('clips coverage and preserves %s row direction', cornerOfOrigin => {
  const grid: TileGrid = {
    tileMatrixSet: {crs: FRAME.crs, matrices: [{...MATRIX, cornerOfOrigin}]},
    limits: [
      {tileMatrix: MATRIX.id, minTileColumn: 1, maxTileColumn: 1, minTileRow: 1, maxTileRow: 1}
    ]
  };
  const tiles = selectTileMatrixTiles(grid, {...FRAME, extent: [0, 0, 1000, 1000]});
  expect(tiles.map(tile => tile.index)).toEqual([{x: 1, y: 1, z: 0}]);
  expect(tiles[0].bbox).toEqual(
    cornerOfOrigin === 'topLeft'
      ? {left: 120, bottom: 170, right: 140, top: 185}
      : {left: 120, bottom: 215, right: 140, top: 230}
  );
  expect(selectTileMatrixTiles({...grid, limits: []}, FRAME)).toEqual([]);
  expect(selectTileMatrixTiles(grid, {...FRAME, extent: [0, 0, 1, 1]})).toEqual([]);
});

test.each([
  {
    crs: 'EPSG:3857',
    origin: [-20037508.342789244, 20037508.342789244],
    resolution: 156543.03392804097
  },
  {crs: 'OGC:CRS84', origin: [-180, 90], resolution: 0.703125}
])('selects canonical WebMercator/CRS84 frame without transforming $crs', ({
  crs,
  origin,
  resolution
}) => {
  const grid: TileGrid = {
    tileMatrixSet: {
      crs,
      matrices: [
        {
          id: '0',
          resolution,
          origin: origin as [number, number],
          cornerOfOrigin: 'topLeft',
          tileSize: [256, 256],
          matrixSize: crs === 'OGC:CRS84' ? [2, 1] : [1, 1]
        }
      ]
    }
  };
  const tiles = selectTileMatrixTiles(grid, {crs, resolution, extent: [-1, -1, 1, 1]});
  expect(tiles.map(tile => tile.index)).toEqual(
    crs === 'OGC:CRS84'
      ? [
          {x: 0, y: 0, z: 0},
          {x: 1, y: 0, z: 0}
        ]
      : [{x: 0, y: 0, z: 0}]
  );
});

test('empty geometry, missing selected-level coverage and outside frames return no tiles', () => {
  expect(selectTileMatrixTiles({tileMatrixSet: {crs: FRAME.crs, matrices: []}}, FRAME)).toEqual([]);
  expect(
    selectTileMatrixTiles(
      {
        ...GRID,
        limits: [
          {tileMatrix: '1', minTileColumn: 0, maxTileColumn: 0, minTileRow: 0, maxTileRow: 0}
        ]
      },
      FRAME
    )
  ).toEqual([]);
  expect(selectTileMatrixTiles(GRID, {...FRAME, extent: [160, 200, 160, 200]})).toEqual([]);
});

test.each([
  {},
  {tileMatrixSet: {...GRID.tileMatrixSet!, crs: ''}},
  {tileMatrixSet: {...GRID.tileMatrixSet!, matrices: [MATRIX, MATRIX]}},
  {tileMatrixSet: {...GRID.tileMatrixSet!, matrices: [{...MATRIX, resolution: -1}]}},
  {
    tileMatrixSet: {
      ...GRID.tileMatrixSet!,
      matrices: [{...MATRIX, variableMatrixWidths: [{coalesce: 3, minTileRow: 0, maxTileRow: 0}]}]
    }
  }
])('rejects incomplete, invalid or unsupported geometry %j', grid => {
  expect(() => selectTileMatrixTiles(grid as TileGrid, FRAME)).toThrow();
});

test.each([
  {crs: 'urn:ogc:def:crs:EPSG::32631'},
  {extent: [NaN, 0, 1, 1]},
  {extent: [0, 0, 1]},
  {extent: [0, 0, Infinity, 1]},
  {extent: [2, 0, 1, 1]},
  {extent: [0, 2, 1, 1]},
  {resolution: 0},
  {resolution: Infinity}
])('rejects invalid or mismatched native frames %j', replacement => {
  expect(() => selectTileMatrixTiles(GRID, {...FRAME, ...replacement} as typeof FRAME)).toThrow();
});

test.each(
  [
    [{tileMatrix: 'unknown', minTileColumn: 0, maxTileColumn: 0, minTileRow: 0, maxTileRow: 0}],
    [{tileMatrix: MATRIX.id, minTileColumn: 0, maxTileColumn: 3, minTileRow: 0, maxTileRow: 0}],
    Array(2).fill({
      tileMatrix: MATRIX.id,
      minTileColumn: 0,
      maxTileColumn: 0,
      minTileRow: 0,
      maxTileRow: 0
    })
  ].map(limits => ({limits}))
)('rejects invalid or ambiguous coverage $limits', ({limits}) => {
  expect(() => selectTileMatrixTiles({...GRID, limits}, FRAME)).toThrow(RangeError);
});

test('enforces eager allocation budget before enumerating a huge matrix', () => {
  expect(() => selectTileMatrixTiles(GRID, FRAME, {maximumTileCount: 5})).toThrow(
    'maximumTileCount'
  );
  expect(selectTileMatrixTiles(GRID, FRAME, {maximumTileCount: 6})).toHaveLength(6);
  for (const maximumTileCount of [-1, 0.5, Infinity])
    expect(() => selectTileMatrixTiles(GRID, FRAME, {maximumTileCount})).toThrow();
  const grid: TileGrid = {
    tileMatrixSet: {
      crs: FRAME.crs,
      matrices: [
        {
          ...MATRIX,
          origin: [0, 0],
          resolution: 1,
          resolutionY: 1,
          tileSize: [1, 1],
          matrixSize: [2 ** 30, 2 ** 30]
        }
      ]
    }
  };
  expect(() =>
    selectTileMatrixTiles(grid, {...FRAME, resolution: 1, extent: [0, -(2 ** 30), 2 ** 30, 0]})
  ).toThrow('maximumTileCount');
});

test('empty coalescence metadata remains a regular grid, malformed bands reject', () => {
  const matrix = {...MATRIX, variableMatrixWidths: []};
  const grid = {tileMatrixSet: {crs: FRAME.crs, matrices: [matrix]}};
  expect(selectTileMatrixTiles(grid, FRAME)).toHaveLength(6);
  expect(() =>
    selectTileMatrixTiles(
      {
        tileMatrixSet: {
          crs: FRAME.crs,
          matrices: [{...MATRIX, variableMatrixWidths: {coalesce: 2}} as unknown as TileMatrix]
        }
      },
      FRAME
    )
  ).toThrow('variable-width');
});
