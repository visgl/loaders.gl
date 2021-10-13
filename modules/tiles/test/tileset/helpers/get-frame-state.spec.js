// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import test from 'tape-promise/tape';
import {getFrameState} from '@loaders.gl/tiles';
import {Viewport} from '@deck.gl/core';
import {equals, Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';

const EPSILON = 1e-5;
const expected = {
  camera: {
    position: [2984642.2356970147, 2727927.6428344236, 4916103.380280777],
    direction: [0, 0, 0],
    up: [0, 0, 0]
  },
  height: 775,
  frameNumber: 1,
  sseDenominator: 1.15
};

test('getFrameState', (t) => {
  const viewport = new Viewport({
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
      plane.getPointDistance(viewportCenterCartesian) > 0,
      'viewport center is on the inside of the frustum plane'
    );
  }

  t.end();
});
