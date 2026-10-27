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

test('High-zoom grid checks use relative tolerance rather than an absolute resolution floor', () => {
  const matrix = createMatrix(30);
  const metadata = (resolution: number) => ({
    tileGrid: {
      tileMatrixSet: {
        crs: 'EPSG:3857',
        matrices: [{...matrix, resolution}]
      }
    }
  });
  // This tiny per-pixel difference accumulates to tens of metres across the matrix.
  expect(() => getTileGridLayerOptions(metadata(matrix.resolution + 9e-11))).toThrow(/requires/);
  expect(getTileGridLayerOptions(metadata(matrix.resolution * (1 + 1e-12)))).toMatchObject({
    minZoom: 30,
    maxZoom: 30,
    tileSize: 512
  });
});

test('Canonical zoom-31 levels retain their declared renderer range', () => {
  expect(
    getTileGridLayerOptions({
      tileGrid: {tileMatrixSet: {crs: 'EPSG:3857', matrices: [createMatrix(30), createMatrix(31)]}}
    })
  ).toEqual({minZoom: 30, maxZoom: 31, tileSize: 512});
});

test.each([
  'urn:ogc:def:crs:EPSG::3857',
  'urn:x-ogc:def:crs:EPSG::3857',
  'http://www.opengis.net/def/crs/EPSG/0/3857',
  'https://www.opengis.net/def/crs/EPSG/0/3857'
])('Canonical service geometry accepts the standard CRS identifier %s', coordinateReferenceSystem => {
  expect(
    getTileGridLayerOptions({
      tileGrid: {tileMatrixSet: {crs: coordinateReferenceSystem, matrices: [createMatrix(0)]}}
    })
  ).toEqual({minZoom: 0, maxZoom: 0, tileSize: 512});
});

test('Default XYZ renderer rejects coalesced rows even when nominal geometry is canonical', () => {
  const matrix = createMatrix(1);
  const grid = {
    tileMatrixSet: {
      crs: 'EPSG:3857',
      matrices: [{...matrix, variableMatrixWidths: [{coalesce: 2, minTileRow: 0, maxTileRow: 0}]}]
    }
  };
  expect(() => getTileGridLayerOptions({tileGrid: grid})).toThrow('custom tile selector');
  expect(
    getTileGridLayerOptions({
      tileGrid: {
        tileMatrixSet: {...grid.tileMatrixSet, matrices: [{...matrix, variableMatrixWidths: []}]}
      }
    })
  ).toEqual({minZoom: 1, maxZoom: 1, tileSize: 512});
});

test('Default XYZ renderer rejects coalesced partial metadata before geometry is complete', () => {
  expect(() =>
    getTileGridLayerOptions({
      tileGrid: {
        matrices: [
          {id: 'partial', variableMatrixWidths: [{coalesce: 2, minTileRow: 0, maxTileRow: 0}]}
        ]
      }
    })
  ).toThrow('custom tile selector');
});
