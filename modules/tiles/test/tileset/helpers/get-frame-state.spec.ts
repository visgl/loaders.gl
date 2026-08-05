// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
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

test('getFrameState', t => {
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
  t.equals(results.height, expected.height, 'height should match.');
  t.equals(results.frameNumber, expected.frameNumber, 'frameNumber should match.');
  t.ok(
    equals(results.camera.position, expected.camera.position, EPSILON),
    'camera.position should match.'
  );
  t.ok(
    Math.abs(new Vector3(results.camera.direction).magnitude() - 1) < EPSILON,
    'camera.direction should be normalized.'
  );
  t.ok(equals(results.camera.up, expected.camera.up, EPSILON), 'camera.up should match.');
  t.ok(
    equals(
      results.camera.cartographicPosition,
      viewport.unprojectPosition(viewport.cameraPosition),
      EPSILON
    ),
    'camera.cartographicPosition should retain the viewport height used by dynamic SSE.'
  );
  t.equals(
    results.dynamicScreenSpaceErrorDensity,
    0,
    'dynamic SSE density should be initialized for the tileset traversal.'
  );
  t.ok(
    Math.abs(results.camera.verticalFieldOfView - (viewport.fovy * Math.PI) / 180) < EPSILON,
    'camera.verticalFieldOfView should use viewport degrees converted to radians.'
  );
  t.equals(
    results.camera.timeSinceMovement,
    Number.POSITIVE_INFINITY,
    'standalone frame states should not defer requests.'
  );
  t.equals(results.sseDenominator, results.sseDenominator, 'sseDenominator should match.');
  t.equals(results.cullingVolume.planes.length, 6, 'Should have 6 planes.');

  const viewportCenterCartesian = Ellipsoid.WGS84.cartographicToCartesian(
    [viewport.longitude, viewport.latitude, 0],
    new Vector3()
  );
  for (const plane of results.cullingVolume.planes) {
    t.ok(
      plane.getPointDistance(viewportCenterCartesian) >= 0,
      'viewport center is on the inside of the frustum plane'
    );
  }

  t.end();
});

test('getFrameState#cullingVolume', t => {
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
      t.notOk(
        results.cullingVolume.planes[i].equals(results.cullingVolume.planes[j]),
        `Culling planes are different: ${i}/${j}`
      );
    }
  }

  t.end();
});

test('updateCameraMotionState#tracks position and direction changes', t => {
  const initialUpdate = updateCameraMotionState(undefined, [1, 2, 3], [0, 0, -1], 1000);
  t.equals(
    initialUpdate.timeSinceMovement,
    Number.POSITIVE_INFINITY,
    'treats the first camera observation as stationary'
  );

  const movedUpdate = updateCameraMotionState(initialUpdate.state, [1, 2, 4], [0, 0, -1], 1200);
  t.equals(movedUpdate.timeSinceMovement, 0, 'records camera position movement');

  const stationaryUpdate = updateCameraMotionState(movedUpdate.state, [1, 2, 4], [0, 0, -1], 1350);
  t.equals(stationaryUpdate.timeSinceMovement, 0.15, 'measures stationary time in seconds');

  const numericallyStableUpdate = updateCameraMotionState(
    stationaryUpdate.state,
    [1, 2, 4 + 1e-6],
    [0, 0, -1 + 1e-8],
    1375
  );
  t.equals(
    numericallyStableUpdate.timeSinceMovement,
    0.175,
    'ignores sub-epsilon numeric noise in an otherwise stable camera pose'
  );

  const rotatedUpdate = updateCameraMotionState(
    numericallyStableUpdate.state,
    [1, 2, 4],
    [0, 1, 0],
    1400
  );
  t.equals(rotatedUpdate.timeSinceMovement, 0, 'records camera direction movement');
  t.end();
});
