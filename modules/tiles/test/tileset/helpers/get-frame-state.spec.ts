// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

import {expect, test} from 'vitest';
import {getFrameState, type Tile3D} from '@loaders.gl/tiles';
import {getProjectedRadius} from '../../../src/tileset-3d/helpers/i3s-lod';
import {updateCameraMotionState} from '../../../src/tileset-3d/helpers/frame-state';
import {WebMercatorViewport, FirstPersonView} from '@deck.gl/core';
import {equals, Matrix4, radians, Vector3} from '@math.gl/core';
import {Ellipsoid, makeOBBFromRegion} from '@math.gl/geospatial';
const EPSILON = 1e-5;
const expected = {
  camera: {
    position: [2984602.959018632, 2728622.046790103, 4917131.9689617995],
    direction: [0, 0, 0],
    up: [0, 0, 0]
  },
  height: 775,
  frameNumber: 1,
  sseDenominator: 2 / 3
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
  expect(results.sseDenominator, 'matches the default deck.gl camera projection').toBeCloseTo(
    expected.sseDenominator
  );
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
test.each([
  30, 60, 90
])('getFrameState matches the %s degree perspective projection', fieldOfView => {
  const viewport = new WebMercatorViewport({width: 800, height: 600, fovy: fieldOfView});
  const frameState = getFrameState(viewport, 1);
  // The vertical projection scale provides an independent check of the SSE factor.
  expect(frameState.sseDenominator).toBeCloseTo(2 / viewport.projectionMatrix[5]);
});

test.each([
  undefined,
  0,
  -30,
  180,
  200,
  Number.NaN,
  Number.POSITIVE_INFINITY
])('getFrameState falls back to 60 degrees for invalid or missing fovy %s', fieldOfView => {
  const viewport = new WebMercatorViewport({width: 800, height: 600});
  // Preserve a valid camera and frustum while emulating a structural viewport's missing metadata.
  const structuralViewport = Object.create(viewport, {fovy: {value: fieldOfView}});
  const frameState = getFrameState(structuralViewport, 1);
  expect(frameState.camera.verticalFieldOfView).toBeCloseTo(Math.PI / 3);
  expect(frameState.sseDenominator).toBeCloseTo(2 / Math.sqrt(3));
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

// Synthetic region near Zürich from issue #3475. No remote tiles or decoder assets are needed.
test.each([
  {
    name: 'street-level default camera',
    width: 898,
    height: 320,
    zoom: 17,
    elevation: 0,
    pitch: 0,
    bearing: 0,
    minimumHeight: 405,
    visible: false
  },
  {
    name: 'elevated camera',
    width: 898,
    height: 320,
    zoom: 17,
    elevation: 405,
    pitch: 0,
    bearing: 0,
    minimumHeight: 405,
    visible: true
  },
  {
    name: 'wide default camera',
    width: 1200,
    height: 700,
    zoom: 16.5,
    elevation: 0,
    pitch: 0,
    bearing: 0,
    minimumHeight: 405,
    visible: true
  },
  {
    name: 'pitched elevated camera',
    width: 898,
    height: 320,
    zoom: 17,
    elevation: 405,
    pitch: 35,
    bearing: 65,
    minimumHeight: 405,
    visible: true
  },
  {
    name: 'sea-level content',
    width: 898,
    height: 320,
    zoom: 17,
    elevation: 0,
    pitch: 0,
    bearing: 0,
    minimumHeight: 0,
    visible: true
  }
])('getFrameState agrees with render clip space for $name', options => {
  const longitude = 8.5391;
  const latitude = 47.3686;
  const viewport = new WebMercatorViewport({
    ...options,
    longitude,
    latitude,
    position: [0, 0, options.elevation]
  });
  const frameState = getFrameState(viewport, 1);
  const region = makeOBBFromRegion([
    radians(longitude - 0.00002),
    radians(latitude - 0.00002),
    radians(longitude + 0.00002),
    radians(latitude + 0.00002),
    options.minimumHeight,
    options.minimumHeight + 33
  ]);
  const clipPosition = new Matrix4(viewport.viewProjectionMatrix).transform([
    ...viewport.projectPosition([longitude, latitude, options.minimumHeight + 16.5]),
    1
  ]);
  const insideClip =
    clipPosition[3] > 0 &&
    clipPosition.slice(0, 3).every(coordinate => Math.abs(coordinate) <= clipPosition[3]);
  expect(insideClip).toBe(options.visible);
  expect(frameState.cullingVolume.computeVisibility(region) !== 'outside').toBe(options.visible);
  expect(frameState.camera.cartographicPosition).toEqual(
    viewport.unprojectPosition(viewport.cameraPosition)
  );
  const cartographicCamera = Ellipsoid.WGS84.cartesianToCartographic(frameState.camera.position);
  expect(cartographicCamera[2]).toBeCloseTo(frameState.camera.cartographicPosition[2], 5);
});

test('getFrameState preserves target elevation for projected I3S radius', () => {
  const radii = [0, 405].map(elevation => {
    const viewport = new WebMercatorViewport({
      longitude: 8.5391,
      latitude: 47.3686,
      width: 898,
      height: 320,
      zoom: 17,
      position: [0, 0, elevation]
    });
    const center = [8.5392, 47.3686, elevation];
    const tile = {
      header: {mbs: [...center, 10]},
      boundingVolume: {center: Ellipsoid.WGS84.cartographicToCartesian(center)}
    } as Tile3D;
    return getProjectedRadius(tile, getFrameState(viewport, 1));
  });
  expect(radii[0]).toBeGreaterThan(0);
  // Moving camera and sphere up together preserves apparent size, apart from ellipsoid curvature.
  expect(radii[1]).toBeCloseTo(radii[0], 1);
});
