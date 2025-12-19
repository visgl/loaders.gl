// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getFrameState} from '@loaders.gl/tiles';
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

test('getFrameState', (t) => {
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
    equals(results.camera.direction, expected.camera.direction, EPSILON),
    'camera.direction should match.'
  );
  t.ok(equals(results.camera.up, expected.camera.up, EPSILON), 'camera.up should match.');
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

test('getFrameState#cullingVolume', (t) => {
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
