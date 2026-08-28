// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OrthographicViewport, WebMercatorViewport} from '@deck.gl/core';
import {Matrix4} from '@math.gl/core';
import {describe, expect, test} from 'vitest';
import {
  getCullBounds,
  isGeoBoundingBox,
  sharedTile2DDeckAdapter,
  transformBox
} from '../src/shared-tile-2d/deck-tileset-adapter';
import {getOSMTileIndices, osmTile2lngLat} from '../src/shared-tile-2d/deck-tile-traversal';

describe('sharedTile2DDeckAdapter', () => {
  test('transforms all four corners and recognizes geographic bounds', () => {
    const matrix = new Matrix4().translate([10, -5, 0]).scale([2, 3, 1]);
    expect(transformBox([0, 0, 2, 4], matrix)).toEqual([10, -5, 14, 7]);
    expect(isGeoBoundingBox({west: -1, south: -2, east: 3, north: 4})).toBe(true);
    expect(isGeoBoundingBox({west: -1, south: -2, east: Number.NaN, north: 4})).toBe(false);
  });

  test('computes geographic indices and bounds with zoom constraints', () => {
    const viewport = new WebMercatorViewport({
      id: 'mercator',
      width: 800,
      height: 600,
      longitude: 0,
      latitude: 0,
      zoom: 2,
      pitch: 0
    });
    const indices = sharedTile2DDeckAdapter.getTileIndices({
      viewState: viewport,
      tileSize: 256,
      minZoom: 0,
      maxZoom: 4,
      zoomOffset: 0,
      zRange: [-100, 100],
      extent: [-20, -20, 20, 20]
    } as any);
    expect(indices.length).toBeGreaterThan(0);
    expect(indices.every(index => index.z <= 4)).toBe(true);

    const bounds = sharedTile2DDeckAdapter.getTileBoundingBox(
      {viewState: viewport, tileSize: 256} as any,
      indices[0]
    );
    expect(isGeoBoundingBox(bounds)).toBe(true);

    expect(
      sharedTile2DDeckAdapter.getTileIndices({
        viewState: viewport,
        tileSize: 512,
        minZoom: 20
      } as any)
    ).toEqual([]);
    expect(
      sharedTile2DDeckAdapter.getTileIndices({
        viewState: viewport,
        tileSize: 512,
        minZoom: 5,
        extent: [-1, -1, 1, 1]
      } as any)[0].z
    ).toBe(5);
  });

  test('computes Cartesian indices through model transforms', () => {
    const viewport = new OrthographicViewport({
      id: 'orthographic',
      width: 400,
      height: 300,
      target: [128, 128, 0],
      zoom: 0
    });
    const modelMatrix = new Matrix4().translate([32, 16, 0]);
    const modelMatrixInverse = modelMatrix.clone().invert();
    const context = {
      viewState: viewport,
      tileSize: 128,
      minZoom: 0,
      maxZoom: 3,
      extent: [0, 0, 512, 512],
      modelMatrix,
      modelMatrixInverse,
      zoomOffset: 1
    } as any;
    const indices = sharedTile2DDeckAdapter.getTileIndices(context);
    expect(indices.length).toBeGreaterThan(0);
    expect(indices.every(index => index.z === 1)).toBe(true);

    const bounds = sharedTile2DDeckAdapter.getTileBoundingBox(context, indices[0]);
    expect('left' in bounds && 'right' in bounds).toBe(true);
  });

  test('unprojects cull rectangles at one elevation and an elevation range', () => {
    const viewport = new OrthographicViewport({
      id: 'orthographic',
      x: 10,
      y: 20,
      width: 400,
      height: 300,
      target: [0, 0, 0],
      zoom: 0
    });
    const cullRect = {x: 30, y: 40, width: 100, height: 80};
    const flatBounds = getCullBounds({viewport, z: 0, cullRect});
    const rangedBounds = getCullBounds({viewport, z: [-10, 20], cullRect});
    expect(flatBounds).toHaveLength(1);
    expect(rangedBounds).toHaveLength(1);
    expect(rangedBounds[0][0]).toBeLessThanOrEqual(rangedBounds[0][2]);
    expect(rangedBounds[0][1]).toBeLessThanOrEqual(rangedBounds[0][3]);
  });
});

describe('deck tile traversal', () => {
  test('converts OSM tile corners and traverses pitched and wrapped maps', () => {
    expect(osmTile2lngLat(0, 0, 0)).toEqual([-180, 85.0511287798066, 0]);
    expect(osmTile2lngLat(1, 1, 1)).toEqual([0, 0, 0]);

    const viewport = new WebMercatorViewport({
      id: 'wrapped',
      width: 1200,
      height: 700,
      longitude: 179,
      latitude: 20,
      zoom: 2,
      pitch: 70,
      bearing: 25,
      repeat: true
    });
    const indices = getOSMTileIndices(viewport, 4, [-500, 1500], [-180, -85, 180, 85]);
    expect(indices.length).toBeGreaterThan(0);
    expect(indices.every(index => index.z <= 4)).toBe(true);
  });
});
