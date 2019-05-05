/* eslint-disable */
import test from 'tape-catch';
import {Vector3, toRadians} from 'math.gl';

import {Cartographic, Ellipsoid} from '@loaders.gl/3d-tiles/math.gl/geospatial';

const radii = new Vector3(1.0, 2.0, 3.0);
const radiiSquared = Vector3.multiplyComponents(radii, radii, new Vector3());
const radiiToTheFourth = Vector3.multiplyComponents(radiiSquared, radiiSquared, new Vector3());
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

const spaceCartographic = new Cartographic(toRadians(-45.0), toRadians(15.0), 330000.0);
const spaceCartographicGeodeticSurfaceNormal = new Vector3(
  0.68301270189221941,
  -0.6830127018922193,
  0.25881904510252074
);

const surfaceCartesian = new Vector3(4094327.7921465295, 1909216.4044747739, 4487348.4088659193);
const surfaceCartographic = new Cartographic(toRadians(25.0), toRadians(45.0), 0.0);

test('default constructor creates zero Ellipsoid', t => {
  const ellipsoid = new Ellipsoid();
  t.equals(ellipsoid.radii, Vector3.ZERO);
  t.equals(ellipsoid.radiiSquared, Vector3.ZERO);
  t.equals(ellipsoid.radiiToTheFourth, Vector3.ZERO);
  t.equals(ellipsoid.oneOverRadii, Vector3.ZERO);
  t.equals(ellipsoid.oneOverRadiiSquared, Vector3.ZERO);
  t.equals(ellipsoid.minimumRadius, 0.0);
  t.equals(ellipsoid.maximumRadius, 0.0);
  t.end();
});

test('fromVector3 creates zero Ellipsoid with no parameters', t => {
  const ellipsoid = Ellipsoid.fromVector3();
  t.equals(ellipsoid.radii, Vector3.ZERO);
  t.equals(ellipsoid.radiiSquared, Vector3.ZERO);
  t.equals(ellipsoid.radiiToTheFourth, Vector3.ZERO);
  t.equals(ellipsoid.oneOverRadii, Vector3.ZERO);
  t.equals(ellipsoid.oneOverRadiiSquared, Vector3.ZERO);
  t.equals(ellipsoid.minimumRadius, 0.0);
  t.equals(ellipsoid.maximumRadius, 0.0);
  t.end();
});

test('constructor computes correct values', t => {
  const ellipsoid = new Ellipsoid(radii.x, radii.y, radii.z);
  t.equals(ellipsoid.radii, radii);
  t.equals(ellipsoid.radiiSquared, radiiSquared);
  t.equals(ellipsoid.radiiToTheFourth, radiiToTheFourth);
  t.equals(ellipsoid.oneOverRadii, oneOverRadii);
  t.equals(ellipsoid.oneOverRadiiSquared, oneOverRadiiSquared);
  t.equals(ellipsoid.minimumRadius, minimumRadius);
  t.equals(ellipsoid.maximumRadius, maximumRadius);
  t.end();
});

test('fromVector3 computes correct values', t => {
  const ellipsoid = Ellipsoid.fromVector3(radii);
  t.equals(ellipsoid.radii, radii);
  t.equals(ellipsoid.radiiSquared, radiiSquared);
  t.equals(ellipsoid.radiiToTheFourth, radiiToTheFourth);
  t.equals(ellipsoid.oneOverRadii, oneOverRadii);
  t.equals(ellipsoid.oneOverRadiiSquared, oneOverRadiiSquared);
  t.equals(ellipsoid.minimumRadius, minimumRadius);
  t.equals(ellipsoid.maximumRadius, maximumRadius);
  t.end();
});

test('geodeticSurfaceNormalCartographic works without a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const returnedResult = ellipsoid.geodeticSurfaceNormalCartographic(spaceCartographic);
  expect(returnedResult).toEqualEpsilon(
    spaceCartographicGeodeticSurfaceNormal,
    CesiumMath.EPSILON15
  );
  t.end();
});

test('geodeticSurfaceNormalCartographic works with a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const result = new Vector3();
  const returnedResult = ellipsoid.geodeticSurfaceNormalCartographic(spaceCartographic, result);
  t.ok(returnedResult === result);
  expect(returnedResult).toEqualEpsilon(
    spaceCartographicGeodeticSurfaceNormal,
    CesiumMath.EPSILON15
  );
  t.end();
});

test('geodeticSurfaceNormal works without a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const returnedResult = ellipsoid.geodeticSurfaceNormal(spaceCartesian);
  expect(returnedResult).toEqualEpsilon(spaceCartesianGeodeticSurfaceNormal, CesiumMath.EPSILON15);
  t.end();
});

test('geodeticSurfaceNormal works with a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const result = new Vector3();
  const returnedResult = ellipsoid.geodeticSurfaceNormal(spaceCartesian, result);
  t.ok(returnedResult === result);
  expect(returnedResult).toEqualEpsilon(spaceCartesianGeodeticSurfaceNormal, CesiumMath.EPSILON15);
  t.end();
});

test('cartographicToCartesian works without a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const returnedResult = ellipsoid.cartographicToCartesian(spaceCartographic);
  expect(returnedResult).toEqualEpsilon(spaceCartesian, CesiumMath.EPSILON7);
  t.end();
});

test('cartographicToCartesian works with a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const result = new Vector3();
  const returnedResult = ellipsoid.cartographicToCartesian(spaceCartographic, result);
  t.ok(result === returnedResult);
  expect(returnedResult).toEqualEpsilon(spaceCartesian, CesiumMath.EPSILON7);
  t.end();
});

test('cartographicArrayToCartesianArray works without a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const returnedResult = ellipsoid.cartographicArrayToCartesianArray([
    spaceCartographic,
    surfaceCartographic
  ]);
  t.equals(returnedResult.length, 2);
  expect(returnedResult[0]).toEqualEpsilon(spaceCartesian, CesiumMath.EPSILON7);
  expect(returnedResult[1]).toEqualEpsilon(surfaceCartesian, CesiumMath.EPSILON7);
  t.end();
});

test('cartographicArrayToCartesianArray works with a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const resultCartesian = new Vector3();
  const result = [resultCartesian];
  const returnedResult = ellipsoid.cartographicArrayToCartesianArray(
    [spaceCartographic, surfaceCartographic],
    result
  );
  t.ok(result === returnedResult);
  t.ok(result[0] === resultCartesian);
  t.equals(returnedResult.length, 2);
  expect(returnedResult[0]).toEqualEpsilon(spaceCartesian, CesiumMath.EPSILON7);
  expect(returnedResult[1]).toEqualEpsilon(surfaceCartesian, CesiumMath.EPSILON7);
  t.end();
});

test('cartesianToCartographic works without a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const returnedResult = ellipsoid.cartesianToCartographic(surfaceCartesian);
  expect(returnedResult).toEqualEpsilon(surfaceCartographic, CesiumMath.EPSILON8);
  t.end();
});

test('cartesianToCartographic works with a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const result = new Cartographic();
  const returnedResult = ellipsoid.cartesianToCartographic(surfaceCartesian, result);
  t.ok(result === returnedResult);
  expect(returnedResult).toEqualEpsilon(surfaceCartographic, CesiumMath.EPSILON8);
  t.end();
});

test('cartesianToCartographic works close to center', t => {
  const expected = new Cartographic(9.999999999999999e-11, 1.0067394967422763e-20, -6378137.0);
  const returnedResult = Ellipsoid.WGS84.cartesianToCartographic(new Vector3(1e-50, 1e-60, 1e-70));
  t.equals(returnedResult, expected);
  t.end();
});

test('cartesianToCartographic return undefined very close to center', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const returnedResult = ellipsoid.cartesianToCartographic(new Vector3(1e-150, 1e-150, 1e-150));
  expect(returnedResult).toBeUndefined();
  t.end();
});

test('cartesianToCartographic return undefined at center', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const returnedResult = ellipsoid.cartesianToCartographic(Vector3.ZERO);
  expect(returnedResult).toBeUndefined();
  t.end();
});

test('cartesianArrayToCartographicArray works without a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const returnedResult = ellipsoid.cartesianArrayToCartographicArray([
    spaceCartesian,
    surfaceCartesian
  ]);
  t.equals(returnedResult.length, 2);
  expect(returnedResult[0]).toEqualEpsilon(spaceCartographic, CesiumMath.EPSILON7);
  expect(returnedResult[1]).toEqualEpsilon(surfaceCartographic, CesiumMath.EPSILON7);
  t.end();
});

test('cartesianArrayToCartographicArray works with a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const resultCartographic = new Cartographic();
  const result = [resultCartographic];
  const returnedResult = ellipsoid.cartesianArrayToCartographicArray(
    [spaceCartesian, surfaceCartesian],
    result
  );
  t.ok(result === returnedResult);
  t.equals(result.length, 2);
  t.ok(result[0] === resultCartographic);
  expect(result[0]).toEqualEpsilon(spaceCartographic, CesiumMath.EPSILON7);
  expect(result[1]).toEqualEpsilon(surfaceCartographic, CesiumMath.EPSILON7);
  t.end();
});

test('scaleToGeodeticSurface scaled in the x direction', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(1.0, 0.0, 0.0);
  const cartesian = new Vector3(9.0, 0.0, 0.0);
  const returnedResult = ellipsoid.scaleToGeodeticSurface(cartesian);
  t.equals(returnedResult, expected);
  t.end();
});

test('scaleToGeodeticSurface scaled in the y direction', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.0, 2.0, 0.0);
  const cartesian = new Vector3(0.0, 8.0, 0.0);
  const returnedResult = ellipsoid.scaleToGeodeticSurface(cartesian);
  t.equals(returnedResult, expected);
  t.end();
});

test('scaleToGeodeticSurface scaled in the z direction', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.0, 0.0, 3.0);
  const cartesian = new Vector3(0.0, 0.0, 8.0);
  const returnedResult = ellipsoid.scaleToGeodeticSurface(cartesian);
  t.equals(returnedResult, expected);
  t.end();
});

test('scaleToGeodeticSurface works without a result parameter', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.2680893773941855, 1.1160466902266495, 2.3559801120411263);
  const cartesian = new Vector3(4.0, 5.0, 6.0);
  const returnedResult = ellipsoid.scaleToGeodeticSurface(cartesian);
  expect(returnedResult).toEqualEpsilon(expected, CesiumMath.EPSILON16);
  t.end();
});

test('scaleToGeodeticSurface works with a result parameter', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.2680893773941855, 1.1160466902266495, 2.3559801120411263);
  const cartesian = new Vector3(4.0, 5.0, 6.0);
  const result = new Vector3();
  const returnedResult = ellipsoid.scaleToGeodeticSurface(cartesian, result);
  t.ok(returnedResult === result);
  expect(result).toEqualEpsilon(expected, CesiumMath.EPSILON16);
  t.end();
});

test('scaleToGeocentricSurface scaled in the x direction', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(1.0, 0.0, 0.0);
  const cartesian = new Vector3(9.0, 0.0, 0.0);
  const returnedResult = ellipsoid.scaleToGeocentricSurface(cartesian);
  t.equals(returnedResult, expected);
  t.end();
});

test('scaleToGeocentricSurface scaled in the y direction', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.0, 2.0, 0.0);
  const cartesian = new Vector3(0.0, 8.0, 0.0);
  const returnedResult = ellipsoid.scaleToGeocentricSurface(cartesian);
  t.equals(returnedResult, expected);
  t.end();
});

test('scaleToGeocentricSurface scaled in the z direction', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.0, 0.0, 3.0);
  const cartesian = new Vector3(0.0, 0.0, 8.0);
  const returnedResult = ellipsoid.scaleToGeocentricSurface(cartesian);
  t.equals(returnedResult, expected);
  t.end();
});

test('scaleToGeocentricSurface works without a result parameter', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.7807200583588266, 0.9759000729485333, 1.1710800875382399);
  const cartesian = new Vector3(4.0, 5.0, 6.0);
  const returnedResult = ellipsoid.scaleToGeocentricSurface(cartesian);
  expect(returnedResult).toEqualEpsilon(expected, CesiumMath.EPSILON16);
  t.end();
});

test('scaleToGeocentricSurface works with a result parameter', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const expected = new Vector3(0.7807200583588266, 0.9759000729485333, 1.1710800875382399);
  const cartesian = new Vector3(4.0, 5.0, 6.0);
  const result = new Vector3();
  const returnedResult = ellipsoid.scaleToGeocentricSurface(cartesian, result);
  t.ok(returnedResult === result);
  expect(result).toEqualEpsilon(expected, CesiumMath.EPSILON16);
  t.end();
});

test('scaleToGeodeticSurface returns undefined at center', t => {
  const ellipsoid = new Ellipsoid(1.0, 2.0, 3.0);
  const cartesian = new Vector3(0.0, 0.0, 0.0);
  const returnedResult = ellipsoid.scaleToGeodeticSurface(cartesian);
  expect(returnedResult).toBeUndefined();
  t.end();
});

test('transformPositionToScaledSpace works without a result parameter', t => {
  const ellipsoid = new Ellipsoid(2.0, 3.0, 4.0);
  const expected = new Vector3(2.0, 2.0, 2.0);
  const cartesian = new Vector3(4.0, 6.0, 8.0);
  const returnedResult = ellipsoid.transformPositionToScaledSpace(cartesian);
  expect(returnedResult).toEqualEpsilon(expected, CesiumMath.EPSILON16);
  t.end();
});

test('transformPositionToScaledSpace works with a result parameter', t => {
  const ellipsoid = new Ellipsoid(2.0, 3.0, 4.0);
  const expected = new Vector3(3.0, 3.0, 3.0);
  const cartesian = new Vector3(6.0, 9.0, 12.0);
  const result = new Vector3();
  const returnedResult = ellipsoid.transformPositionToScaledSpace(cartesian, result);
  t.ok(returnedResult === result);
  expect(result).toEqualEpsilon(expected, CesiumMath.EPSILON16);
  t.end();
});

test('transformPositionFromScaledSpace works without a result parameter', t => {
  const ellipsoid = new Ellipsoid(2.0, 3.0, 4.0);
  const expected = new Vector3(4.0, 6.0, 8.0);
  const cartesian = new Vector3(2.0, 2.0, 2.0);
  const returnedResult = ellipsoid.transformPositionFromScaledSpace(cartesian);
  expect(returnedResult).toEqualEpsilon(expected, CesiumMath.EPSILON16);
  t.end();
});

test('transformPositionFromScaledSpace works with a result parameter', t => {
  const ellipsoid = new Ellipsoid(2.0, 3.0, 4.0);
  const expected = new Vector3(6.0, 9.0, 12.0);
  const cartesian = new Vector3(3.0, 3.0, 3.0);
  const result = new Vector3();
  const returnedResult = ellipsoid.transformPositionFromScaledSpace(cartesian, result);
  t.ok(returnedResult === result);
  expect(result).toEqualEpsilon(expected, CesiumMath.EPSILON16);
  t.end();
});

test('equals works in all cases', t => {
  const ellipsoid = new Ellipsoid(1.0, 0.0, 0.0);
  t.equals(ellipsoid.equals(new Ellipsoid(1.0, 0.0, 0.0)), true);
  t.equals(ellipsoid.equals(new Ellipsoid(1.0, 1.0, 0.0)), false);
  t.equals(ellipsoid.equals(undefined), false);
  t.end();
});

test('toString produces expected values', t => {
  const expected = '(1, 2, 3)';
  const ellipsoid = new Ellipsoid(1, 2, 3);
  t.equals(ellipsoid.toString(), expected);
  t.end();
});

test('constructor throws if x less than 0', t => {
  t.throws(() => new Ellipsoid(-1, 0, 0));
  t.end();
});

test('constructor throws if y less than 0', t => {
  t.throws(() => new Ellipsoid(0, -1, 0));
  t.end();
});

test('constructor throws if z less than 0', t => {
  t.throws(() => new Ellipsoid(0, 0, -1));
  t.end();
});

test('expect Ellipsoid.geocentricSurfaceNormal is be Vector3.normalize', t => {
  t.ok(Ellipsoid.WGS84.geocentricSurfaceNormal === Vector3.normalize);
  t.end();
});

test('geodeticSurfaceNormalCartographic throws with no cartographic', t => {
  t.throws(() => Ellipsoid.WGS84.geodeticSurfaceNormalCartographic(undefined));
  t.end();
});

test('geodeticSurfaceNormal throws with no cartesian', t => {
  t.throws(() => Ellipsoid.WGS84.geodeticSurfaceNormal(undefined));
  t.end();
});

test('cartographicToCartesian throws with no cartographic', t => {
  t.throws(() => Ellipsoid.WGS84.cartographicToCartesian(undefined));
  t.end();
});

test('cartographicArrayToCartesianArray throws with no cartographics', t => {
  t.throws(() => Ellipsoid.WGS84.cartographicArrayToCartesianArray(undefined));
  t.end();
});

test('cartesianToCartographic throws with no cartesian', t => {
  t.throws(() => Ellipsoid.WGS84.cartesianToCartographic(undefined));
  t.end();
});

test('cartesianArrayToCartographicArray throws with no cartesians', t => {
  t.throws(() => Ellipsoid.WGS84.cartesianArrayToCartographicArray(undefined));
  t.end();
});

test('scaleToGeodeticSurface throws with no cartesian', t => {
  t.throws(() => Ellipsoid.WGS84.scaleToGeodeticSurface(undefined));
  t.end();
});

test('scaleToGeocentricSurface throws with no cartesian', t => {
  t.throws(() => Ellipsoid.WGS84.scaleToGeocentricSurface(undefined));
  t.end();
});

test('clone copies any object with the proper structure', t => {
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

test('clone uses result parameter if provided', t => {
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

test('getSurfaceNormalIntersectionWithZAxis throws with no position', t => {
  t.throws(() => Ellipsoid.WGS84.getSurfaceNormalIntersectionWithZAxis(undefined));
  t.end();
});

test('getSurfaceNormalIntersectionWithZAxis throws if the ellipsoid is not an ellipsoid of revolution', t => {
  const ellipsoid = new Ellipsoid(1, 2, 3);
  const cartesian = new Vector3();
  t.throws(() => ellipsoid.getSurfaceNormalIntersectionWithZAxis(cartesian));
  t.end();
});

test('getSurfaceNormalIntersectionWithZAxis throws if the ellipsoid has radii.z === 0', t => {
  const ellipsoid = new Ellipsoid(1, 2, 0);
  const cartesian = new Vector3();
  t.throws(() => ellipsoid.getSurfaceNormalIntersectionWithZAxis(cartesian));
  t.end();
});

test('getSurfaceNormalIntersectionWithZAxis works without a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const cartographic = Cartographic.fromDegrees(35.23, 33.23);
  const cartesianOnTheSurface = ellipsoid.cartographicToCartesian(cartographic);
  const returnedResult = ellipsoid.getSurfaceNormalIntersectionWithZAxis(cartesianOnTheSurface);
  t.ok(returnedResult instanceof Vector3);
  t.end();
});

test('getSurfaceNormalIntersectionWithZAxis works with a result parameter', t => {
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

test('getSurfaceNormalIntersectionWithZAxis returns undefined if the result is outside the ellipsoid with buffer parameter', t => {
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

test('getSurfaceNormalIntersectionWithZAxis returns undefined if the result is outside the ellipsoid without buffer parameter', t => {
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

test('getSurfaceNormalIntersectionWithZAxis returns a result that is equal to a value that computed in a different way', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const cartographic = Cartographic.fromDegrees(35.23, 33.23);
  let cartesianOnTheSurface = ellipsoid.cartographicToCartesian(cartographic);
  const surfaceNormal = ellipsoid.geodeticSurfaceNormal(cartesianOnTheSurface);
  const magnitude = cartesianOnTheSurface.x / surfaceNormal.x;

  const expected = new Vector3();
  expected.z = cartesianOnTheSurface.z - surfaceNormal.z * magnitude;
  let result = ellipsoid.getSurfaceNormalIntersectionWithZAxis(cartesianOnTheSurface, undefined);
  expect(result).toEqualEpsilon(expected, CesiumMath.EPSILON8);

  // at the equator
  cartesianOnTheSurface = new Vector3(ellipsoid.radii.x, 0, 0);
  result = ellipsoid.getSurfaceNormalIntersectionWithZAxis(cartesianOnTheSurface, undefined);
  expect(result).toEqualEpsilon(Vector3.ZERO, CesiumMath.EPSILON8);

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
  expect(resultCartographic).toEqualEpsilon(cartographic, CesiumMath.EPSILON8);

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
  expect(resultCartographic).toEqualEpsilon(cartographic, CesiumMath.EPSILON8);

  t.end();
});

test('ellipsoid is initialized with _squaredXOverSquaredZ property', t => {
  const ellipsoid = new Ellipsoid(4, 4, 3);

  const squaredXOverSquaredZ = ellipsoid.radiiSquared.x / ellipsoid.radiiSquared.z;
  t.equals(ellipsoid._squaredXOverSquaredZ, squaredXOverSquaredZ);
  t.end();
});

// createPackableSpecs(Ellipsoid, Ellipsoid.WGS84, [Ellipsoid.WGS84.radii.x, Ellipsoid.WGS84.radii.y, Ellipsoid.WGS84.radii.z]);
