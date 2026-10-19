// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {getTileGridLayerOptions} from '../src/lib/tile-grid-options';
import type {TileMatrix} from '@math.gl/geospatial';

/** Creates a canonical logical 512-pixel XYZ matrix. */
function createMatrix(zoom: number): TileMatrix {
  return {
    id: String(zoom),
    resolution: 40075016.68557849 / (512 * 2 ** zoom),
    origin: [-20037508.342789244, 20037508.342789244],
    cornerOfOrigin: 'topLeft',
    tileSize: [512, 512],
    matrixSize: [2 ** zoom, 2 ** zoom]
  };
}

test('Default renderer uses declared logical tile size and preserves a maximum zoom of zero', () => {
  expect(getTileGridLayerOptions(null)).toEqual({minZoom: 0, maxZoom: 30, tileSize: 256});
  expect(getTileGridLayerOptions({maxZoom: 0})).toEqual({minZoom: 0, maxZoom: 0, tileSize: 256});
  expect(
    getTileGridLayerOptions({
      tileGrid: {tileMatrixSet: {crs: 'EPSG:3857', matrices: [createMatrix(2), createMatrix(3)]}}
    })
  ).toEqual({minZoom: 2, maxZoom: 3, tileSize: 512});
});

test.each([
  {crs: 'EPSG:32610', matrices: [createMatrix(0)]},
  {crs: 'EPSG:3857', matrices: []},
  {crs: 'EPSG:3857', matrices: [createMatrix(0), createMatrix(2)]},
  {crs: 'EPSG:3857', matrices: [{...createMatrix(0), id: 'native'}]},
  {crs: 'EPSG:3857', matrices: [{...createMatrix(0), cornerOfOrigin: 'bottomLeft'}]},
  {crs: 'EPSG:3857', matrices: [{...createMatrix(0), resolutionY: 2}]},
  {crs: 'EPSG:3857', matrices: [{...createMatrix(0), origin: [0, 0]}]}
] as any[])('Default renderer rejects incompatible matrix geometry (%j)', set => {
  expect(() => getTileGridLayerOptions({tileGrid: {tileMatrixSet: set}})).toThrow(/requires/);
});
