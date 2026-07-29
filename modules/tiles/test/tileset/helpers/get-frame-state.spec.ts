// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getFrameState} from '@loaders.gl/tiles';
import {WebMercatorViewport, FirstPersonView} from '@deck.gl/core';
import {equals, radians, Matrix4, Vector3} from '@math.gl/core';
import {CullingVolume} from '@math.gl/culling';
import {Ellipsoid} from '@math.gl/geospatial';
import {createBoundingVolume} from '../../../src/tileset-3d/helpers/bounding-volume';

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

test('getFrameState#groundHeightDatum lifts the culling frame uniformly', t => {
  const viewport = new WebMercatorViewport({
    width: 793,
    height: 775,
    latitude: 50.751537058389985,
    longitude: 42.42694203247012,
    pitch: 30,
    bearing: -120,
    zoom: 15.5
  });

  // getFrameState returns a module-level singleton cullingVolume, so extract everything
  // needed from one call before making the next.
  const base = getFrameState(viewport, 1);
  const baseCartographic = Ellipsoid.WGS84.cartesianToCartographic(
    new Vector3(base.camera.position),
    new Vector3()
  );

  const shifted = getFrameState(viewport, 2, {groundHeightDatum: 500});
  const shiftedCartographic = Ellipsoid.WGS84.cartesianToCartographic(
    new Vector3(shifted.camera.position),
    new Vector3()
  );

  t.ok(
    Math.abs(shiftedCartographic[2] - baseCartographic[2] - 500) < 1e-3,
    'camera cartographic height shifts by exactly the datum'
  );
  t.ok(
    Math.abs(shiftedCartographic[0] - baseCartographic[0]) < 1e-9 &&
      Math.abs(shiftedCartographic[1] - baseCartographic[1]) < 1e-9,
    'camera longitude/latitude are unchanged'
  );

  const liftedCenterCartesian = Ellipsoid.WGS84.cartographicToCartesian(
    [viewport.longitude, viewport.latitude, 500],
    new Vector3()
  );
  for (const plane of shifted.cullingVolume.planes) {
    t.ok(
      plane.getPointDistance(liftedCenterCartesian) >= 0,
      'viewport center at datum altitude is on the inside of the frustum plane'
    );
  }

  t.end();
});

test('getFrameState#groundHeightDatum un-culls high-altitude region tiles (#3475)', t => {
  // Bahnhofstrasse, Zürich: swisstopo swissBUILDINGS3D leaf regions sit at 405-438 m
  // above the ellipsoid. At street zoom the camera is only ~194 m above deck's z=0
  // plane, so a sea-level culling frame places the volumes above the frustum entirely.
  const viewport = new WebMercatorViewport({
    width: 898,
    height: 320,
    longitude: 8.5391,
    latitude: 47.3686,
    zoom: 17,
    pitch: 0,
    bearing: 0
  });
  const region = [radians(8.5381), radians(47.3676), radians(8.5401), radians(47.3696), 405, 438];
  const boundingVolume = createBoundingVolume({region}, new Matrix4());

  const seaLevelFrame = getFrameState(viewport, 1);
  const seaLevelMask = seaLevelFrame.cullingVolume.computeVisibilityWithPlaneMask(
    boundingVolume,
    CullingVolume.MASK_INDETERMINATE
  );

  // 405 = the local ground height at the viewport center — what the 'auto' derivation
  // converges to once the leaf-level regions are loaded.
  const datumFrame = getFrameState(viewport, 2, {groundHeightDatum: 405});
  const datumMask = datumFrame.cullingVolume.computeVisibilityWithPlaneMask(
    boundingVolume,
    CullingVolume.MASK_INDETERMINATE
  );

  t.equals(
    seaLevelMask,
    CullingVolume.MASK_OUTSIDE,
    'sea-level culling frame culls the high-altitude volume (bug precondition)'
  );
  t.notEqual(
    datumMask,
    CullingVolume.MASK_OUTSIDE,
    'ground-datum culling frame keeps the high-altitude volume'
  );

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
