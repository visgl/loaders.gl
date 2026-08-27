// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

import {expect, test} from 'vitest';
import {getFrameState} from '@loaders.gl/tiles';
import {updateCameraMotionState} from '../../../src/tileset-3d/helpers/frame-state';
import {WebMercatorViewport, FirstPersonView} from '@deck.gl/core';
import {equals, Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
const EPSILON = 1e-5;
const expected = {
  camera: {
    position: [2984602.959018632, 2728622.046790103, 4917131.9689617995],
    direction: [0, 0, 0],
    up: [0, 0, 0]
  },
  height: 775,
  frameNumber: 1,
  sseDenominator: 1.15
};
test('getFrameState', () => {
  const viewport = new WebMercatorViewport({
    width: 793,
    height: 775,
    latitude: 50.751537058389985,
    longitude: 42.42694203247012,
    pitch: 30,
    bearing: -120,
    zoom: 15.5
  });
  const results = getFrameState(viewport, 1);
  expect(results.height, 'height should match.').toBe(expected.height);
  expect(results.frameNumber, 'frameNumber should match.').toBe(expected.frameNumber);
  expect(
    equals(results.camera.position, expected.camera.position, EPSILON),
    'camera.position should match.'
  ).toBeTruthy();
  expect(
    Math.abs(new Vector3(results.camera.direction).magnitude() - 1) < EPSILON,
    'camera.direction should be normalized.'
  ).toBeTruthy();
  expect(
    equals(results.camera.up, expected.camera.up, EPSILON),
    'camera.up should match.'
  ).toBeTruthy();
  expect(
    equals(
      results.camera.cartographicPosition,
      viewport.unprojectPosition(viewport.cameraPosition),
      EPSILON
    ),
    'camera.cartographicPosition should retain the viewport height used by dynamic SSE.'
  ).toBeTruthy();
  expect(
    results.dynamicScreenSpaceErrorDensity,
    'dynamic SSE density should be initialized for the tileset traversal.'
  ).toBe(0);
  expect(
    Math.abs(results.camera.verticalFieldOfView - (viewport.fovy * Math.PI) / 180) < EPSILON,
    'camera.verticalFieldOfView should use viewport degrees converted to radians.'
  ).toBeTruthy();
  expect(
    results.camera.timeSinceMovement,
    'standalone frame states should not defer requests.'
  ).toBe(Number.POSITIVE_INFINITY);
  expect(results.sseDenominator, 'sseDenominator should match.').toBe(results.sseDenominator);
  expect(results.cullingVolume.planes.length, 'Should have 6 planes.').toBe(6);
  const viewportCenterCartesian = Ellipsoid.WGS84.cartographicToCartesian(
    [viewport.longitude, viewport.latitude, 0],
    new Vector3()
  );
  for (const plane of results.cullingVolume.planes) {
    expect(
      plane.getPointDistance(viewportCenterCartesian) >= 0,
      'viewport center is on the inside of the frustum plane'
    ).toBeTruthy();
  }
});
test('getFrameState#cullingVolume', () => {
  const viewport = new FirstPersonView({near: 1, far: 100}).makeViewport({
    width: 800,
    height: 500,
    viewState: {
      longitude: -122.45,
      latitude: 37.78,
      position: [0, 0, 200],
      pitch: 0,
      bearing: 0
    }
  });
  const results = getFrameState(viewport, 1);
  for (let i = 0; i < 5; i++) {
    for (let j = i + 1; j < 6; j++) {
      expect(
        results.cullingVolume.planes[i].equals(results.cullingVolume.planes[j]),
        `Culling planes are different: ${i}/${j}`
      ).toBeFalsy();
    }
  }
});
test('updateCameraMotionState#tracks position and direction changes', () => {
  const initialUpdate = updateCameraMotionState(undefined, [1, 2, 3], [0, 0, -1], 1000);
  expect(initialUpdate.timeSinceMovement, 'treats the first camera observation as stationary').toBe(
    Number.POSITIVE_INFINITY
  );
  const movedUpdate = updateCameraMotionState(initialUpdate.state, [1, 2, 4], [0, 0, -1], 1200);
  expect(movedUpdate.timeSinceMovement, 'records camera position movement').toBe(0);
  const stationaryUpdate = updateCameraMotionState(movedUpdate.state, [1, 2, 4], [0, 0, -1], 1350);
  expect(stationaryUpdate.timeSinceMovement, 'measures stationary time in seconds').toBe(0.15);
  const numericallyStableUpdate = updateCameraMotionState(
    stationaryUpdate.state,
    [1, 2, 4 + 1e-6],
    [0, 0, -1 + 1e-8],
    1375
  );
  expect(
    numericallyStableUpdate.timeSinceMovement,
    'ignores sub-epsilon numeric noise in an otherwise stable camera pose'
  ).toBe(0.175);
  const rotatedUpdate = updateCameraMotionState(
    numericallyStableUpdate.state,
    [1, 2, 4],
    [0, 1, 0],
    1400
  );
  expect(rotatedUpdate.timeSinceMovement, 'records camera direction movement').toBe(0);
});
