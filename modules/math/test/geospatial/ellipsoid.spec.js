/* eslint-disable */
import test from 'tape-catch';
import {Vector3, radians as toRadians, degrees as toDegrees} from 'math.gl';
import {Cartographic, Ellipsoid, MathUtils} from '@loaders.gl/math';
import {tapeEquals, tapeEqualsEpsilon} from '../test-utils/tape-assertions';

Vector3.ZERO = new Vector3(0, 0, 0);

const radii = new Vector3(1.0, 2.0, 3.0);
const radiiSquared = new Vector3(radii).multiply(radii);
const radiiToTheFourth = new Vector3(radiiSquared).multiply(radiiSquared);
const oneOverRadii = new Vector3(1 / radii.x, 1 / radii.y, 1 / radii.z);
const oneOverRadiiSquared = new Vector3(1 / radiiSquared.x, 1 / radiiSquared.y, 1 / radiiSquared.z);
const minimumRadius = 1.0;
const maximumRadius = 3.0;

// All values computes using STK Components
const spaceCartesian = new Vector3(4582719.8827300891, -4582719.8827300882, 1725510.4250797231);
const spaceCartesianGeodeticSurfaceNormal = new Vector3(
  0.6829975339864266,
  -0.68299753398642649,
  0.25889908678270795
);

const spaceCartographic = new Vector3(-45.0, 15.0, 330000.0);
const spaceCartographicGeodeticSurfaceNormal = new Vector3(
  0.68301270189221941,
  -0.6830127018922193,
  0.25881904510252074
);

const surfaceCartesian = new Vector3(4094327.7921465295, 1909216.4044747739, 4487348.4088659193);
const surfaceCartographic = new Vector3(25.0, 45.0, 0.0);

test('Ellipsoid#default constructor creates zero Ellipsoid', t => {
  const ellipsoid = new Ellipsoid();
  tapeEquals(t, ellipsoid.radii, Vector3.ZERO);
  tapeEquals(t, ellipsoid.radiiSquared, Vector3.ZERO);
  tapeEquals(t, ellipsoid.radiiToTheFourth, Vector3.ZERO);
  tapeEquals(t, ellipsoid.oneOverRadii, Vector3.ZERO);
  tapeEquals(t, ellipsoid.oneOverRadiiSquared, Vector3.ZERO);
  t.equals(ellipsoid.minimumRadius, 0.0);
  t.equals(ellipsoid.maximumRadius, 0.0);
  t.end();
});

test('Ellipsoid#constructor computes correct values', t => {
  const ellipsoid = new Ellipsoid(radii.x, radii.y, radii.z);
  tapeEquals(t, ellipsoid.radii, radii);
  tapeEquals(t, ellipsoid.radiiSquared, radiiSquared);
  tapeEquals(t, ellipsoid.radiiToTheFourth, radiiToTheFourth);
  tapeEquals(t, ellipsoid.oneOverRadii, oneOverRadii);
  tapeEquals(t, ellipsoid.oneOverRadiiSquared, oneOverRadiiSquared);
  t.equals(ellipsoid.minimumRadius, minimumRadius);
  t.equals(ellipsoid.maximumRadius, maximumRadius);
  t.end();
});

test('Ellipsoid#fromVector3 computes correct values', t => {
  const ellipsoid = Ellipsoid.fromVector3(radii);
  tapeEquals(t, ellipsoid.radii, radii);
  tapeEquals(t, ellipsoid.radiiSquared, radiiSquared);
  tapeEquals(t, ellipsoid.radiiToTheFourth, radiiToTheFourth);
  tapeEquals(t, ellipsoid.oneOverRadii, oneOverRadii);
  tapeEquals(t, ellipsoid.oneOverRadiiSquared, oneOverRadiiSquared);
  t.equals(ellipsoid.minimumRadius, minimumRadius);
  t.equals(ellipsoid.maximumRadius, maximumRadius);
  t.end();
});

test('Ellipsoid#geodeticSurfaceNormalCartographic works without a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const returnedResult = ellipsoid.geodeticSurfaceNormalCartographic(spaceCartographic);
  tapeEqualsEpsilon(t, returnedResult, spaceCartographicGeodeticSurfaceNormal, MathUtils.EPSILON15);
  t.end();
});

test('Ellipsoid#geodeticSurfaceNormalCartographic works with a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const result = new Vector3();
  const returnedResult = ellipsoid.geodeticSurfaceNormalCartographic(spaceCartographic, result);
  t.ok(returnedResult === result);
  tapeEqualsEpsilon(t, returnedResult, spaceCartographicGeodeticSurfaceNormal, MathUtils.EPSILON15);
  t.end();
});

test('Ellipsoid#geodeticSurfaceNormal works without a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const returnedResult = ellipsoid.geodeticSurfaceNormal(spaceCartesian);
  tapeEqualsEpsilon(t, returnedResult, spaceCartesianGeodeticSurfaceNormal, MathUtils.EPSILON15);
  t.end();
});

test('Ellipsoid#geodeticSurfaceNormal works with a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const result = new Vector3();
  const returnedResult = ellipsoid.geodeticSurfaceNormal(spaceCartesian, result);
  t.ok(returnedResult === result);
  tapeEqualsEpsilon(t, returnedResult, spaceCartesianGeodeticSurfaceNormal, MathUtils.EPSILON15);
  t.end();
});

test('Ellipsoid#cartographicToCartesian works without a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const returnedResult = ellipsoid.cartographicToCartesian(spaceCartographic);
  tapeEqualsEpsilon(t, returnedResult, spaceCartesian, MathUtils.EPSILON7);
  t.end();
});

test('Ellipsoid#cartographicToCartesian works with a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const result = new Vector3();
  const returnedResult = ellipsoid.cartographicToCartesian(spaceCartographic, result);
  t.ok(result === returnedResult);
  tapeEqualsEpsilon(t, returnedResult, spaceCartesian, MathUtils.EPSILON7);
  t.end();
});

test('Ellipsoid#cartesianToCartographic works without a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const returnedResult = ellipsoid.cartesianToCartographic(surfaceCartesian);
  tapeEqualsEpsilon(t, returnedResult, surfaceCartographic, MathUtils.EPSILON8);
  t.end();
});

test('Ellipsoid#cartesianToCartographic works with a result parameter', t => {
  const result = new Vector3();
  const returnedResult = Ellipsoid.WGS84.cartesianToCartographic(surfaceCartesian, result);
  t.ok(result === returnedResult);
  tapeEqualsEpsilon(t, returnedResult, surfaceCartographic, MathUtils.EPSILON8);
  t.end();
});

test('Ellipsoid#cartesianToCartographic works close to center', t => {
  const expected = new Vector3(
    toDegrees(9.999999999999999e-11),
    toDegrees(1.0067394967422763e-20),
    -6378137.0
  );
  const returnedResult = Ellipsoid.WGS84.cartesianToCartographic(new Vector3(1e-50, 1e-60, 1e-70));
  t.ok(returnedResult, expected);
  t.end();
});

test('Ellipsoid#cartesianToCartographic return undefined very close to center', t => {
  const returnedResult = Ellipsoid.WGS84.cartesianToCartographic(
    new Vector3(1e-150, 1e-150, 1e-150)
  );
  t.equals(returnedResult, undefined);
  t.end();
});

test('Ellipsoid#cartesianToCartographic return undefined at center', t => {
  const returnedResult = Ellipsoid.WGS84.cartesianToCartographic(Vector3.ZERO);
  t.equals(returnedResult, undefined);
  t.end();
});

/*
test('Ellipsoid#scaleToGeodeticSurface scaled in the x direction', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(1.0, 0.0, 0.0);
  const cartesian = new Vector3(9.0, 0.0, 0.0);
  const returnedResult = ellipsoid.scaleToGeodeticSurface(cartesian);
  t.equals(returnedResult, expected);
  t.end();
});

test('Ellipsoid#scaleToGeodeticSurface scaled in the y direction', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.0, 2.0, 0.0);
  const cartesian = new Vector3(0.0, 8.0, 0.0);
  const returnedResult = ellipsoid.scaleToGeodeticSurface(cartesian);
  t.equals(returnedResult, expected);
  t.end();
});

test('Ellipsoid#scaleToGeodeticSurface scaled in the z direction', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.0, 0.0, 3.0);
  const cartesian = new Vector3(0.0, 0.0, 8.0);
  const returnedResult = ellipsoid.scaleToGeodeticSurface(cartesian);
  t.equals(returnedResult, expected);
  t.end();
});

test('Ellipsoid#scaleToGeodeticSurface works without a result parameter', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.2680893773941855, 1.1160466902266495, 2.3559801120411263);
  const cartesian = new Vector3(4.0, 5.0, 6.0);
  const returnedResult = ellipsoid.scaleToGeodeticSurface(cartesian);
  tapeEqualsEpsilon(t, returnedResult, expected, MathUtils.EPSILON16);
  t.end();
});

test('Ellipsoid#scaleToGeodeticSurface works with a result parameter', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.2680893773941855, 1.1160466902266495, 2.3559801120411263);
  const cartesian = new Vector3(4.0, 5.0, 6.0);
  const result = new Vector3();
  const returnedResult = ellipsoid.scaleToGeodeticSurface(cartesian, result);
  t.ok(returnedResult === result);
  tapeEqualsEpsilon(t, result, expected, MathUtils.EPSILON16);
  t.end();
});
*/

/*
test('Ellipsoid#scaleToGeocentricSurface scaled in the x direction', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(1.0, 0.0, 0.0);
  const cartesian = new Vector3(9.0, 0.0, 0.0);
  const returnedResult = ellipsoid.scaleToGeocentricSurface(cartesian);
  t.equals(returnedResult, expected);
  t.end();
});

test('Ellipsoid#scaleToGeocentricSurface scaled in the y direction', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.0, 2.0, 0.0);
  const cartesian = new Vector3(0.0, 8.0, 0.0);
  const returnedResult = ellipsoid.scaleToGeocentricSurface(cartesian);
  t.equals(returnedResult, expected);
  t.end();
});

test('Ellipsoid#scaleToGeocentricSurface scaled in the z direction', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.0, 0.0, 3.0);
  const cartesian = new Vector3(0.0, 0.0, 8.0);
  const returnedResult = ellipsoid.scaleToGeocentricSurface(cartesian);
  t.equals(returnedResult, expected);
  t.end();
});

test('Ellipsoid#scaleToGeocentricSurface works without a result parameter', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.7807200583588266, 0.9759000729485333, 1.1710800875382399);
  const cartesian = new Vector3(4.0, 5.0, 6.0);
  const returnedResult = ellipsoid.scaleToGeocentricSurface(cartesian);
  tapeEqualsEpsilon(t, returnedResult, expected, MathUtils.EPSILON16);
  t.end();
});

test('Ellipsoid#scaleToGeocentricSurface works with a result parameter', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.7807200583588266, 0.9759000729485333, 1.1710800875382399);
  const cartesian = new Vector3(4.0, 5.0, 6.0);
  const result = new Vector3();
  const returnedResult = ellipsoid.scaleToGeocentricSurface(cartesian, result);
  t.ok(returnedResult === result);
  tapeEqualsEpsilon(t, result, expected, MathUtils.EPSILON16);
  t.end();
});

test('Ellipsoid#scaleToGeodeticSurface returns undefined at center', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const cartesian = new Vector3(0.0, 0.0, 0.0);
  const returnedResult = ellipsoid.scaleToGeodeticSurface(cartesian);
  expect(returnedResult).toBeUndefined();
  t.end();
});

test('Ellipsoid#transformPositionToScaledSpace works without a result parameter', t => {
  const ellipsoid = new Ellipsoid(2.0, 3.0, 4.0);
  const expected = new Vector3(2.0, 2.0, 2.0);
  const cartesian = new Vector3(4.0, 6.0, 8.0);
  const returnedResult = ellipsoid.transformPositionToScaledSpace(cartesian);
  tapeEqualsEpsilon(t, returnedResult, expected, MathUtils.EPSILON16);
  t.end();
});

test('Ellipsoid#transformPositionToScaledSpace works with a result parameter', t => {
  const ellipsoid = new Ellipsoid(2.0, 3.0, 4.0);
  const expected = new Vector3(3.0, 3.0, 3.0);
  const cartesian = new Vector3(6.0, 9.0, 12.0);
  const result = new Vector3();
  const returnedResult = ellipsoid.transformPositionToScaledSpace(cartesian, result);
  t.ok(returnedResult === result);
  tapeEqualsEpsilon(t, result, expected, MathUtils.EPSILON16);
  t.end();
});

test('Ellipsoid#transformPositionFromScaledSpace works without a result parameter', t => {
  const ellipsoid = new Ellipsoid(2.0, 3.0, 4.0);
  const expected = new Vector3(4.0, 6.0, 8.0);
  const cartesian = new Vector3(2.0, 2.0, 2.0);
  const returnedResult = ellipsoid.transformPositionFromScaledSpace(cartesian);
  tapeEqualsEpsilon(t, returnedResult, expected, MathUtils.EPSILON16);
  t.end();
});

test('Ellipsoid#transformPositionFromScaledSpace works with a result parameter', t => {
  const ellipsoid = new Ellipsoid(2.0, 3.0, 4.0);
  const expected = new Vector3(6.0, 9.0, 12.0);
  const cartesian = new Vector3(3.0, 3.0, 3.0);
  const result = new Vector3();
  const returnedResult = ellipsoid.transformPositionFromScaledSpace(cartesian, result);
  t.ok(returnedResult === result);
  tapeEqualsEpsilon(t, result, expected, MathUtils.EPSILON16);
  t.end();
});

test('Ellipsoid#equals works in all cases', t => {
  const ellipsoid = new Ellipsoid(1.0, 0.0, 0.0);
  t.equals(ellipsoid.equals(new Ellipsoid(1.0, 0.0, 0.0)), true);
  t.equals(ellipsoid.equals(new Ellipsoid(1.0, 1.0, 0.0)), false);
  t.equals(ellipsoid.equals(undefined), false);
  t.end();
});

test('Ellipsoid#toString produces expected values', t => {
  const expected = '(1, 2, 3)';
  const ellipsoid = new Ellipsoid(1, 2, 3);
  t.equals(ellipsoid.toString(), expected);
  t.end();
});

test('Ellipsoid#constructor throws if x less than 0', t => {
  t.throws(() => new Ellipsoid(-1, 0, 0));
  t.end();
});

test('Ellipsoid#constructor throws if y less than 0', t => {
  t.throws(() => new Ellipsoid(0, -1, 0));
  t.end();
});

test('Ellipsoid#constructor throws if z less than 0', t => {
  t.throws(() => new Ellipsoid(0, 0, -1));
  t.end();
});

test('Ellipsoid#expect Ellipsoid.geocentricSurfaceNormal is be Vector3.normalize', t => {
  t.ok(Ellipsoid.WGS84.geocentricSurfaceNormal === Vector3.normalize);
  t.end();
});

test('Ellipsoid#geodeticSurfaceNormalCartographic throws with no cartographic', t => {
  t.throws(() => Ellipsoid.WGS84.geodeticSurfaceNormalCartographic(undefined));
  t.end();
});

test('Ellipsoid#geodeticSurfaceNormal throws with no cartesian', t => {
  t.throws(() => Ellipsoid.WGS84.geodeticSurfaceNormal(undefined));
  t.end();
});

test('Ellipsoid#cartographicToCartesian throws with no cartographic', t => {
  t.throws(() => Ellipsoid.WGS84.cartographicToCartesian(undefined));
  t.end();
});

test('Ellipsoid#cartographicArrayToCartesianArray throws with no cartographics', t => {
  t.throws(() => Ellipsoid.WGS84.cartographicArrayToCartesianArray(undefined));
  t.end();
});

test('Ellipsoid#cartesianToCartographic throws with no cartesian', t => {
  t.throws(() => Ellipsoid.WGS84.cartesianToCartographic(undefined));
  t.end();
});

test('Ellipsoid#cartesianArrayToCartographicArray throws with no cartesians', t => {
  t.throws(() => Ellipsoid.WGS84.cartesianArrayToCartographicArray(undefined));
  t.end();
});

test('Ellipsoid#scaleToGeodeticSurface throws with no cartesian', t => {
  t.throws(() => Ellipsoid.WGS84.scaleToGeodeticSurface(undefined));
  t.end();
});

test('Ellipsoid#scaleToGeocentricSurface throws with no cartesian', t => {
  t.throws(() => Ellipsoid.WGS84.scaleToGeocentricSurface(undefined));
  t.end();
});

test('Ellipsoid#clone copies any object with the proper structure', t => {
  const myEllipsoid = {
    _radii: {x: 1.0, y: 2.0, z: 3.0},
    _radiiSquared: {x: 4.0, y: 5.0, z: 6.0},
    _radiiToTheFourth: {x: 7.0, y: 8.0, z: 9.0},
    _oneOverRadii: {x: 10.0, y: 11.0, z: 12.0},
    _oneOverRadiiSquared: {x: 13.0, y: 14.0, z: 15.0},
    _minimumRadius: 16.0,
    _maximumRadius: 17.0,
    _centerToleranceSquared: 18.0
  };

  const cloned = Ellipsoid.clone(myEllipsoid);
  t.ok(cloned instanceof Ellipsoid);
  t.equals(cloned, myEllipsoid);
  t.end();
});

test('Ellipsoid#clone uses result parameter if provided', t => {
  const myEllipsoid = {
    _radii: {x: 1.0, y: 2.0, z: 3.0},
    _radiiSquared: {x: 4.0, y: 5.0, z: 6.0},
    _radiiToTheFourth: {x: 7.0, y: 8.0, z: 9.0},
    _oneOverRadii: {x: 10.0, y: 11.0, z: 12.0},
    _oneOverRadiiSquared: {x: 13.0, y: 14.0, z: 15.0},
    _minimumRadius: 16.0,
    _maximumRadius: 17.0,
    _centerToleranceSquared: 18.0
  };

  const result = new Ellipsoid();
  const cloned = Ellipsoid.clone(myEllipsoid, result);
  t.ok(cloned === result);
  t.equals(cloned, myEllipsoid);
  t.end();
});

test('Ellipsoid#getSurfaceNormalIntersectionWithZAxis throws with no position', t => {
  t.throws(() => Ellipsoid.WGS84.getSurfaceNormalIntersectionWithZAxis(undefined));
  t.end();
});

test('Ellipsoid#getSurfaceNormalIntersectionWithZAxis throws if the ellipsoid is not an ellipsoid of revolution', t => {
  const ellipsoid = new Ellipsoid(1, 2, 3);
  const cartesian = new Vector3();
  t.throws(() => ellipsoid.getSurfaceNormalIntersectionWithZAxis(cartesian));
  t.end();
});

test('Ellipsoid#getSurfaceNormalIntersectionWithZAxis throws if the ellipsoid has radii.z === 0', t => {
  const ellipsoid = new Ellipsoid(1, 2, 0);
  const cartesian = new Vector3();
  t.throws(() => ellipsoid.getSurfaceNormalIntersectionWithZAxis(cartesian));
  t.end();
});

test('Ellipsoid#getSurfaceNormalIntersectionWithZAxis works without a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const cartographic = Cartographic.fromDegrees(35.23, 33.23);
  const cartesianOnTheSurface = ellipsoid.cartographicToCartesian(cartographic);
  const returnedResult = ellipsoid.getSurfaceNormalIntersectionWithZAxis(cartesianOnTheSurface);
  t.ok(returnedResult instanceof Vector3);
  t.end();
});

test('Ellipsoid#getSurfaceNormalIntersectionWithZAxis works with a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const cartographic = Cartographic.fromDegrees(35.23, 33.23);
  const cartesianOnTheSurface = ellipsoid.cartographicToCartesian(cartographic);
  const returnedResult = ellipsoid.getSurfaceNormalIntersectionWithZAxis(
    cartesianOnTheSurface,
    undefined,
    cartesianOnTheSurface
  );
  t.ok(returnedResult === cartesianOnTheSurface);
  t.end();
});

test('Ellipsoid#getSurfaceNormalIntersectionWithZAxis returns undefined if the result is outside the ellipsoid with buffer parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const cartographic = Cartographic.fromDegrees(35.23, 33.23);
  const cartesianOnTheSurface = ellipsoid.cartographicToCartesian(cartographic);
  const returnedResult = ellipsoid.getSurfaceNormalIntersectionWithZAxis(
    cartesianOnTheSurface,
    ellipsoid.radii.z
  );
  t.ok(returnedResult === undefined);
  t.end();
});

test('Ellipsoid#getSurfaceNormalIntersectionWithZAxis returns undefined if the result is outside the ellipsoid without buffer parameter', t => {
  const majorAxis = 10;
  const minorAxis = 1;
  const ellipsoid = new Ellipsoid(majorAxis, majorAxis, minorAxis);
  const cartographic = Cartographic.fromDegrees(45.0, 90.0);
  const cartesianOnTheSurface = ellipsoid.cartographicToCartesian(cartographic);
  const returnedResult = ellipsoid.getSurfaceNormalIntersectionWithZAxis(
    cartesianOnTheSurface,
    undefined
  );
  t.ok(returnedResult === undefined);
  t.end();
});

test('Ellipsoid#getSurfaceNormalIntersectionWithZAxis returns a result that is equal to a value that computed in a different way', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const cartographic = Cartographic.fromDegrees(35.23, 33.23);
  let cartesianOnTheSurface = ellipsoid.cartographicToCartesian(cartographic);
  const surfaceNormal = ellipsoid.geodeticSurfaceNormal(cartesianOnTheSurface);
  const magnitude = cartesianOnTheSurface.x / surfaceNormal.x;

  const expected = new Vector3();
  expected.z = cartesianOnTheSurface.z - surfaceNormal.z * magnitude;
  let result = ellipsoid.getSurfaceNormalIntersectionWithZAxis(cartesianOnTheSurface, undefined);
  tapeEqualsEpsilon(t, result, expected, MathUtils.EPSILON8);

  // at the equator
  cartesianOnTheSurface = new Vector3(ellipsoid.radii.x, 0, 0);
  result = ellipsoid.getSurfaceNormalIntersectionWithZAxis(cartesianOnTheSurface, undefined);
  tapeEqualsEpsilon(t, result, Vector3.ZERO, MathUtils.EPSILON8);

  t.end();
});

test("getSurfaceNormalIntersectionWithZAxis returns a result that when it's used as an origin for a vector with the surface normal direction it produces an accurate cartographic", t => {
  const ellipsoid = Ellipsoid.WGS84;
  const cartographic = Cartographic.fromDegrees(35.23, 33.23);
  const cartesianOnTheSurface = ellipsoid.cartographicToCartesian(cartographic);
  const surfaceNormal = ellipsoid.geodeticSurfaceNormal(cartesianOnTheSurface);

  const result = ellipsoid.getSurfaceNormalIntersectionWithZAxis(cartesianOnTheSurface, undefined);

  const surfaceNormalWithLength = Vector3.multiplyByScalar(
    surfaceNormal,
    ellipsoid.maximumRadius,
    new Vector3()
  );
  const position = Vector3.add(result, surfaceNormalWithLength, new Vector3());
  const resultCartographic = ellipsoid.cartesianToCartographic(position);
  resultCartographic.height = 0.0;
  tapeEqualsEpsilon(t, resultCartographic, cartographic, MathUtils.EPSILON8);

  // at the north pole
  cartographic = Cartographic.fromDegrees(0, 90);
  cartesianOnTheSurface = new Vector3(0, 0, ellipsoid.radii.z);
  surfaceNormal = ellipsoid.geodeticSurfaceNormal(cartesianOnTheSurface);
  surfaceNormalWithLength = Vector3.multiplyByScalar(
    surfaceNormal,
    ellipsoid.maximumRadius,
    new Vector3()
  );
  result = ellipsoid.getSurfaceNormalIntersectionWithZAxis(cartesianOnTheSurface, undefined);
  position = Vector3.add(result, surfaceNormalWithLength, new Vector3());
  resultCartographic = ellipsoid.cartesianToCartographic(position);
  resultCartographic.height = 0.0;
  tapeEqualsEpsilon(t, resultCartographic, cartographic, MathUtils.EPSILON8);

  t.end();
});

test('Ellipsoid#ellipsoid is initialized with _squaredXOverSquaredZ property', t => {
  const ellipsoid = new Ellipsoid(4, 4, 3);

  const squaredXOverSquaredZ = ellipsoid.radiiSquared.x / ellipsoid.radiiSquared.z;
  t.equals(ellipsoid._squaredXOverSquaredZ, squaredXOverSquaredZ);
  t.end();
});

// createPackableSpecs(Ellipsoid, Ellipsoid.WGS84, [Ellipsoid.WGS84.radii.x, Ellipsoid.WGS84.radii.y, Ellipsoid.WGS84.radii.z]);
*/
