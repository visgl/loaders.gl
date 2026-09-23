// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {WebMercatorViewport} from '@deck.gl/core';
import {Matrix4} from '@math.gl/core';
import {createTilesetViewState} from '../examples/website/3d-tiles/create-tileset-view-state';

const DEFAULT_VIEW_STATE = {longitude: 0, latitude: 0, zoom: 3, pitch: 0, bearing: 0};

test('3D Tiles example centers the render camera above elevated content', () => {
  const tileset = {cartographicCenter: [8.5391, 47.3686, 421.5], zoom: 17};
  const viewState = createTilesetViewState(tileset, DEFAULT_VIEW_STATE);
  const viewport = new WebMercatorViewport({...viewState, width: 898, height: 320});
  const clipPosition = new Matrix4(viewport.viewProjectionMatrix).transform([
    ...viewport.projectPosition(tileset.cartographicCenter),
    1
  ]);
  expect(viewport.unprojectPosition(viewport.cameraPosition)[2]).toBeGreaterThan(438);
  expect(clipPosition[3]).toBeGreaterThan(0);
  for (const coordinate of clipPosition.slice(0, 3)) {
    expect(Math.abs(coordinate)).toBeLessThan(clipPosition[3]);
  }
});

test.each([
  [0, 0, 0],
  [10, 20, 600]
])('3D Tiles example preserves explicit camera position [%s, %s, %s]', (east, north, elevation) => {
  const viewState = createTilesetViewState(
    {cartographicCenter: [8.5391, 47.3686, 421.5], zoom: 17},
    DEFAULT_VIEW_STATE,
    {position: [east, north, elevation], zoom: 16, bearing: 30, pitch: 45}
  );
  expect(viewState).toMatchObject({
    position: [east, north, elevation],
    zoom: 16,
    bearing: 30,
    pitch: 45
  });
});

test.each([
  undefined,
  Number.NaN,
  Number.POSITIVE_INFINITY,
  0,
  -30
])('3D Tiles example resets camera elevation when switching to a center at %s', elevation => {
  const previousViewState = createTilesetViewState(
    {cartographicCenter: [8.5391, 47.3686, 421.5], zoom: 17},
    DEFAULT_VIEW_STATE
  );
  const center = elevation === undefined ? [0, 0] : [0, 0, elevation];
  const nextViewState = createTilesetViewState(
    {cartographicCenter: center, zoom: 15},
    previousViewState
  );
  expect(nextViewState.position).toEqual([0, 0, Number.isFinite(elevation) ? elevation : 0]);
});
