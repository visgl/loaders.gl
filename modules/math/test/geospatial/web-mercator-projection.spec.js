/* eslint-disable */
import test from 'tape-catch';
import {tapeEquals} from '../test-utils/tape-assertions';

import {Vector2, Vector3, Vector3 as Cartographic} from 'math.gl';

import {WebMercatorProjection, Ellipsoid} from '@loaders.gl/3d-tiles/math.gl/geospatial';

const PI_OVER_TWO = Math.PI / 2;
const PI_OVER_FOUR = Math.PI / 4;

test('construct0', t => {
  const projection = new WebMercatorProjection();
  t.equals(projection.ellipsoid, Ellipsoid.WGS84);
  t.end();
});

test('construct1', t => {
  const ellipsoid = Ellipsoid.UNIT_SPHERE;
  const projection = new WebMercatorProjection(ellipsoid);
  t.equals(projection.ellipsoid, ellipsoid);
  t.end();
});

test('project0', t => {
  const height = 10.0;
  const cartographic = new Cartographic(0.0, 0.0, height);
  const projection = new WebMercatorProjection();
  t.equals(projection.project(cartographic), new Vector3(0.0, 0.0, height));
  t.end();
});

test('project1', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const cartographic = new Cartographic(Math.PI, PI_OVER_FOUR, 0.0);

  // expected equations from Wolfram MathWorld:
  // http://mathworld.wolfram.com/MercatorProjection.html
  const expected = new Vector3(
    ellipsoid.maximumRadius * cartographic.longitude,
    ellipsoid.maximumRadius * Math.log(Math.tan(Math.PI / 4.0 + cartographic.latitude / 2.0)),
    0.0
  );

  const projection = new WebMercatorProjection(ellipsoid);
  expect(projection.project(cartographic)).toEqualEpsilon(expected, CesiumMath.EPSILON8);
  t.end();
});

test('project2', t => {
  const ellipsoid = Ellipsoid.UNIT_SPHERE;
  const cartographic = new Cartographic(-Math.PI, PI_OVER_FOUR, 0.0);

  // expected equations from Wolfram MathWorld:
  // http://mathworld.wolfram.com/MercatorProjection.html
  const expected = new Vector3(
    ellipsoid.maximumRadius * cartographic.longitude,
    ellipsoid.maximumRadius * Math.log(Math.tan(Math.PI / 4.0 + cartographic.latitude / 2.0)),
    0.0
  );

  const projection = new WebMercatorProjection(ellipsoid);
  expect(projection.project(cartographic)).toEqualEpsilon(expected, CesiumMath.EPSILON15);
  t.end();
});

test('project3', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const cartographic = new Cartographic(Math.PI, PI_OVER_FOUR, 0.0);

  // expected equations from Wolfram MathWorld:
  // http://mathworld.wolfram.com/MercatorProjection.html
  const expected = new Vector3(
    ellipsoid.maximumRadius * cartographic.longitude,
    ellipsoid.maximumRadius * Math.log(Math.tan(Math.PI / 4.0 + cartographic.latitude / 2.0)),
    0.0
  );

  const projection = new WebMercatorProjection(ellipsoid);
  const result = new Vector3(0.0, 0.0, 0.0);
  const returnValue = projection.project(cartographic, result);
  t.equals(result, returnValue);
  expect(result).toEqualEpsilon(expected, CesiumMath.EPSILON8);
  t.end();
});

test('unproject0', t => {
  const cartographic = new Cartographic(PI_OVER_TWO, PI_OVER_FOUR, 12.0);
  const projection = new WebMercatorProjection();
  const projected = projection.project(cartographic);
  expect(projection.unproject(projected)).toEqualEpsilon(cartographic, CesiumMath.EPSILON14);
  t.end();
});

test('unproject1', t => {
  const cartographic = new Cartographic(PI_OVER_TWO, PI_OVER_FOUR, 12.0);
  const projection = new WebMercatorProjection();
  const projected = projection.project(cartographic);
  const result = new Cartographic(0.0, 0.0, 0.0);
  const returnValue = projection.unproject(projected, result);
  t.equals(result, returnValue);
  expect(result).toEqualEpsilon(cartographic, CesiumMath.EPSILON14);
  t.end();
});

test('unproject is correct at corners', t => {
  const projection = new WebMercatorProjection();
  const southwest = projection.unproject(new Cartesian2(-20037508.342787, -20037508.342787));
  expect(southwest.longitude).toEqualEpsilon(-Math.PI, CesiumMath.EPSILON12);
  expect(southwest.latitude).toEqualEpsilon(
    CesiumMath.toRadians(-85.05112878),
    CesiumMath.EPSILON11
  );

  const southeast = projection.unproject(new Cartesian2(20037508.342787, -20037508.342787));
  expect(southeast.longitude).toEqualEpsilon(Math.PI, CesiumMath.EPSILON12);
  expect(southeast.latitude).toEqualEpsilon(
    CesiumMath.toRadians(-85.05112878),
    CesiumMath.EPSILON11
  );

  const northeast = projection.unproject(new Cartesian2(20037508.342787, 20037508.342787));
  expect(northeast.longitude).toEqualEpsilon(Math.PI, CesiumMath.EPSILON12);
  expect(northeast.latitude).toEqualEpsilon(
    CesiumMath.toRadians(85.05112878),
    CesiumMath.EPSILON11
  );

  const northwest = projection.unproject(new Cartesian2(-20037508.342787, 20037508.342787));
  expect(northwest.longitude).toEqualEpsilon(-Math.PI, CesiumMath.EPSILON12);
  expect(northwest.latitude).toEqualEpsilon(
    CesiumMath.toRadians(85.05112878),
    CesiumMath.EPSILON11
  );
  t.end();
});

test('project is correct at corners.', t => {
  const maxLatitude = WebMercatorProjection.MaximumLatitude;

  const projection = new WebMercatorProjection();

  const southwest = projection.project(new Cartographic(-Math.PI, -maxLatitude));
  expect(southwest.x).toEqualEpsilon(-20037508.342787, CesiumMath.EPSILON3);
  expect(southwest.y).toEqualEpsilon(-20037508.342787, CesiumMath.EPSILON3);

  const southeast = projection.project(new Cartographic(Math.PI, -maxLatitude));
  expect(southeast.x).toEqualEpsilon(20037508.342787, CesiumMath.EPSILON3);
  expect(southeast.y).toEqualEpsilon(-20037508.342787, CesiumMath.EPSILON3);

  const northeast = projection.project(new Cartographic(Math.PI, maxLatitude));
  expect(northeast.x).toEqualEpsilon(20037508.342787, CesiumMath.EPSILON3);
  expect(northeast.y).toEqualEpsilon(20037508.342787, CesiumMath.EPSILON3);

  const northwest = projection.project(new Cartographic(-Math.PI, maxLatitude));
  expect(northwest.x).toEqualEpsilon(-20037508.342787, CesiumMath.EPSILON3);
  expect(northwest.y).toEqualEpsilon(20037508.342787, CesiumMath.EPSILON3);
  t.end();
});

test('projected y is clamped to valid latitude range.', t => {
  const projection = new WebMercatorProjection();
  const southPole = projection.project(new Cartographic(0.0, -PI_OVER_TWO));
  const southLimit = projection.project(
    new Cartographic(0.0, -WebMercatorProjection.MaximumLatitude)
  );
  t.equals(southPole.y, southLimit.y);

  const northPole = projection.project(new Cartographic(0.0, PI_OVER_TWO));
  const northLimit = projection.project(
    new Cartographic(0.0, WebMercatorProjection.MaximumLatitude)
  );
  t.equals(northPole.y, northLimit.y);
  t.end();
});

test('project throws without cartesian', t => {
  const projection = new WebMercatorProjection();
  expect(function() {
    return projection.unproject();
  }).toThrowDeveloperError();
  t.end();
});
