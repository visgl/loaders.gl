import test from 'tape-catch';
import {Vector3} from 'math.gl';

import {
  GeographicProjection,
  Cartographic,
  Ellipsoid
} from '@loaders.gl/3d-tiles/math.gl/geospatial';

const PI_OVER_TWO = Math.PI / 2;
const PI_OVER_FOUR = Math.PI / 4;

test('construct0', t => {
  const projection = new GeographicProjection();
  t.equals(projection.ellipsoid, Ellipsoid.WGS84);
});

test('construct1', t => {
  const ellipsoid = Ellipsoid.UNIT_SPHERE;
  const projection = new GeographicProjection(ellipsoid);
  t.equals(projection.ellipsoid, ellipsoid);
});

test('project0', t => {
  const height = 10.0;
  const cartographic = new Cartographic(0.0, 0.0, height);
  const projection = new GeographicProjection();
  t.equals(projection.project(cartographic), new Vector3(0.0, 0.0, height));
});

test('project1', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const cartographic = new Cartographic(Math.PI, PI_OVER_TWO, 0.0);
  const expected = new Vector3(Math.PI * ellipsoid.radii.x, PI_OVER_TWO * ellipsoid.radii.x, 0.0);
  const projection = new GeographicProjection(ellipsoid);
  t.equals(projection.project(cartographic), expected);
});

test('project2', t => {
  const ellipsoid = Ellipsoid.UNIT_SPHERE;
  const cartographic = new Cartographic(-Math.PI, PI_OVER_TWO, 0.0);
  const expected = new Vector3(-Math.PI, PI_OVER_TWO, 0.0);
  const projection = new GeographicProjection(ellipsoid);
  t.equals(projection.project(cartographic), expected);
});

test('project3', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const cartographic = new Cartographic(Math.PI, PI_OVER_TWO, 0.0);
  const expected = new Vector3(Math.PI * ellipsoid.radii.x, PI_OVER_TWO * ellipsoid.radii.x, 0.0);
  const projection = new GeographicProjection(ellipsoid);
  const result = new Vector3(0.0, 0.0, 0.0);
  const returnValue = projection.project(cartographic, result);
  t.equals(result, returnValue);
  t.equals(result, expected);
});

test('unproject0', t => {
  const cartographic = new Cartographic(PI_OVER_TWO, PI_OVER_FOUR, 12.0);
  const projection = new GeographicProjection();
  const projected = projection.project(cartographic);
  t.equals(projection.unproject(projected), cartographic);
});

test('unproject1', t => {
  const cartographic = new Cartographic(PI_OVER_TWO, PI_OVER_FOUR, 12.0);
  const projection = new GeographicProjection();
  const projected = projection.project(cartographic);
  const result = new Cartographic(0.0, 0.0, 0.0);
  const returnValue = projection.unproject(projected, result);
  t.equals(result, returnValue);
  t.equals(result, cartographic);
});

test('project throws without cartesian', t => {
  const projection = new GeographicProjection();
  t.throw(() => projection.unproject());
});
