/*
import test from 'tape-catch';
import {Vector3, radians as toRadians} from 'math.gl';
import {Cartographic, Ellipsoid} from '@loaders.gl/math';

const surfaceCartesian = new Vector3(4094327.7921465295, 1909216.4044747739, 4487348.4088659193);
const surfaceCartographic = new Cartographic(toRadians(25.0), toRadians(45.0), 0.0);

test('Cartographic#fromRadians works without a result parameter', t => {
  const c = Cartographic.fromRadians([Math.PI / 2, Math.PI / 4, 100.0]);
  t.equals(c.longitude, 90);
  t.equals(c.latitude, 45);
  t.equals(c.height, 100.0);
  t.end();
});

test('Cartographic#fromRadians works with a result parameter', t => {
  const result = new Cartographic();
  const c = Cartographic.fromRadians(Math.PI / 2, Math.PI / 4, 100.0, result);
  t.equals(result, c);
  t.equals(c.longitude, Math.PI / 2);
  t.equals(c.latitude, Math.PI / 4);
  t.equals(c.height, 100.0);
  t.end();
});

test('Cartographic#fromRadians throws without longitude or latitude parameter but defaults altitude', t => {
  t.throws(() => Cartographic.fromRadians(undefined, 0.0));
  t.throws(() => Cartographic.fromRadians(0.0, undefined));

  const c = Cartographic.fromRadians([Math.PI / 2, Math.PI / 4]);
  t.equals(c.longitude, Math.PI / 2);
  t.equals(c.latitude, Math.PI / 4);
  t.equals(c.height, 0.0);
  t.end();
});

test('Cartographic#toRadians works without a result parameter', t => {
  const c = Cartographic.fromDegrees(90.0, 45.0, 100.0);
  t.equals(c[0], Math.PI / 2);
  t.equals(c[1], Math.PI / 4);
  t.equals(c[2], 100);
  t.end();
});

test('Cartographic#toRadians works with a result parameter', t => {
  const result = new Cartographic();
  const c = Cartographic.fromDegrees(90.0, 45.0, 100.0, result);
  expect(result).toBe(c);
  t.equals(c.longitude, Math.PI / 2);
  t.equals(c.latitude, Math.PI / 4);
  t.equals(c.height, 100);
  t.end();
});

test('Cartographic#fromDegrees throws without longitude or latitude parameter but defaults altitude', t => {
  expect(function() {
    Cartographic.fromDegrees(undefined, 0.0);
  }).toThrowDeveloperError();
  expect(function() {
    Cartographic.fromDegrees(0.0, undefined);
  }).toThrowDeveloperError();
  const c = Cartographic.fromDegrees(90.0, 45.0);
  t.equals(c.longitude, Math.PI / 2);
  t.equals(c.latitude, Math.PI / 4);
  t.equals(c.height, 0.0);
  t.end();
});

test('Cartographic#toCartesian conversion from Cartographic input to lnglatz output', t => {
  const lon = toRadians(150);
  const lat = toRadians(-40);
  const height = 100000;
  const actual = Cartographic.toCartesian([lon, lat, height]);

  const ellipsoid = Ellipsoid.WGS84;
  const expected = ellipsoid.cartographicToCartesian(new Cartographic(lon, lat, height));

  t.equals(actual, expected);
  t.end();
});

test('Cartographic#fromCartesian works without a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const c = Cartographic.fromCartesian(surfaceCartesian, ellipsoid);
  expect(c).toEqualEpsilon(surfaceCartographic, CesiumMath.EPSILON8);
  t.end();
});

test('Cartographic#fromCartesian works with a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const result = new Cartographic();
  const c = Cartographic.fromCartesian(surfaceCartesian, ellipsoid, result);
  expect(c).toEqualEpsilon(surfaceCartographic, CesiumMath.EPSILON8);
  expect(result).toBe(c);
  t.end();
});

test('Cartographic#fromCartesian works without an ellipsoid', t => {
  const c = Cartographic.fromCartesian(surfaceCartesian);
  expect(c).toEqualEpsilon(surfaceCartographic, CesiumMath.EPSILON8);
  t.end();
});

test('Cartographic#fromCartesian throws when there is no cartesian', t => {
  expect(function() {
    Cartographic.fromCartesian();
  }).toThrowDeveloperError();
  t.end();
});

test('Cartographic#fromCartesian works with a value that is above the ellipsoid surface', t => {
  const cartographic1 = Cartographic.fromDegrees(35.766989, 33.333602, 3000);
  const cartesian1 = Vector3.fromRadians(
    cartographic1.longitude,
    cartographic1.latitude,
    cartographic1.height
  );
  const cartographic2 = Cartographic.fromCartesian(cartesian1);

  expect(cartographic2).toEqualEpsilon(cartographic1, CesiumMath.EPSILON8);
  t.end();
});

test('Cartographic#fromCartesian works with a value that is bellow the ellipsoid surface', t => {
  const cartographic1 = Cartographic.fromDegrees(35.766989, 33.333602, -3000);
  const cartesian1 = Vector3.fromRadians(
    cartographic1.longitude,
    cartographic1.latitude,
    cartographic1.height
  );
  const cartographic2 = Cartographic.fromCartesian(cartesian1);

  expect(cartographic2).toEqualEpsilon(cartographic1, CesiumMath.EPSILON8);
  t.end();
});

test('Cartographic#clone without a result parameter', t => {
  const cartographic = new Cartographic(1.0, 2.0, 3.0);
  const result = cartographic.clone();
  expect(cartographic).not.toBe(result);
  t.equals(cartographic, result);
  t.end();
});

test('Cartographic#clone with a result parameter', t => {
  const cartographic = new Cartographic(1.0, 2.0, 3.0);
  const result = new Cartographic();
  const returnedResult = cartographic.clone(result);
  expect(cartographic).not.toBe(result);
  expect(result).toBe(returnedResult);
  t.equals(cartographic, result);
  t.end();
});

test('Cartographic#clone works with "this" result parameter', t => {
  const cartographic = new Cartographic(1.0, 2.0, 3.0);
  const returnedResult = cartographic.clone(cartographic);
  expect(cartographic).toBe(returnedResult);
  t.end();
});

test('Cartographic#equals', t => {
  const cartographic = new Cartographic(1.0, 2.0, 3.0);
  t.equals(cartographic.equals(new Cartographic(1.0, 2.0, 3.0)), true);
  t.equals(cartographic.equals(new Cartographic(2.0, 2.0, 3.0)), false);
  t.equals(cartographic.equals(new Cartographic(2.0, 1.0, 3.0)), false);
  t.equals(cartographic.equals(new Cartographic(1.0, 2.0, 4.0)), false);
  t.equals(cartographic.equals(undefined), false);
  t.end();
});

test('Cartographic#equalsEpsilon', t => {
  const cartographic = new Cartographic(1.0, 2.0, 3.0);
  t.equals(cartographic.equalsEpsilon(new Cartographic(1.0, 2.0, 3.0), 0.0), true);
  t.equals(cartographic.equalsEpsilon(new Cartographic(1.0, 2.0, 3.0), 1.0), true);
  t.equals(cartographic.equalsEpsilon(new Cartographic(2.0, 2.0, 3.0), 1.0), true);
  t.equals(cartographic.equalsEpsilon(new Cartographic(1.0, 3.0, 3.0), 1.0), true);
  t.equals(cartographic.equalsEpsilon(new Cartographic(1.0, 2.0, 4.0), 1.0), true);
  t.equals(cartographic.equalsEpsilon(new Cartographic(2.0, 2.0, 3.0), 0.99999), false);
  t.equals(cartographic.equalsEpsilon(new Cartographic(1.0, 3.0, 3.0), 0.99999), false);
  t.equals(cartographic.equalsEpsilon(new Cartographic(1.0, 2.0, 4.0), 0.99999), false);
  t.equals(cartographic.equalsEpsilon(undefined, 1), false);
  t.end();
});

test('Cartographic#toString', t => {
  const cartographic = new Cartographic(1.123, 2.345, 6.789);
  t.equals(cartographic.toString(), '(1.123, 2.345, 6.789)');
  t.end();
});

test('Cartographic#clone returns undefined without cartographic parameter', t => {
  expect(Cartographic.clone(undefined)).toBeUndefined();
  t.end();
});

test('Cartographic#equalsEpsilon throws without numeric epsilon', t => {
  expect(function() {
    Cartographic.equalsEpsilon(new Cartographic(), new Cartographic(), {});
  }).toThrowDeveloperError();
  t.end();
});
*/