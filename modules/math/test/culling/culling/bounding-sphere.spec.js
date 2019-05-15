/* eslint-disable */
import test from 'tape-catch';
import {tapeEquals} from '../../test-utils/tape-assertions';

import {Vector3, /* Matrix3, Quaternion, */ radians as toRadians} from 'math.gl';
import {OrientedBoundingBox, BoundingSphere, Intersect, Plane} from '@loaders.gl/math'; // '@math.gl/culling';

const positionsRadius = 1.0;
const positionsCenter = new Vector3(10000001.0, 0.0, 0.0);

const center = new Vector3(10000000.0, 0.0, 0.0);

function getPositions() {
  return [
    Vector3.add(center, new Vector3(1, 0, 0), new Vector3()),
    Vector3.add(center, new Vector3(2, 0, 0), new Vector3()),
    Vector3.add(center, new Vector3(0, 0, 0), new Vector3()),
    Vector3.add(center, new Vector3(1, 1, 0), new Vector3()),
    Vector3.add(center, new Vector3(1, -1, 0), new Vector3()),
    Vector3.add(center, new Vector3(1, 0, 1), new Vector3()),
    Vector3.add(center, new Vector3(1, 0, -1), new Vector3())
  ];
}

function getPositionsAsFlatArray() {
  const positions = getPositions();
  const result = [];
  for (let i = 0; i < positions.length; ++i) {
    result.push(positions[i].x);
    result.push(positions[i].y);
    result.push(positions[i].z);
  }
  return result;
}

function getPositionsAsFlatArrayWithStride5() {
  const positions = getPositions();
  const result = [];
  for (let i = 0; i < positions.length; ++i) {
    result.push(positions[i].x);
    result.push(positions[i].y);
    result.push(positions[i].z);
    result.push(1.23);
    result.push(4.56);
  }
  return result;
}

function getPositionsAsEncodedFlatArray() {
  const positions = getPositions();
  const high = [];
  const low = [];
  for (let i = 0; i < positions.length; ++i) {
    const encoded = EncodedVector3.fromCartesian(positions[i]);
    high.push(encoded.high.x);
    high.push(encoded.high.y);
    high.push(encoded.high.z);
    low.push(encoded.low.x);
    low.push(encoded.low.y);
    low.push(encoded.low.z);
  }
  return {
    high,
    low
  };
}

test('BoundingSphere#default constructing produces expected values', t => {
  const sphere = new BoundingSphere();
  tapeEquals(t, sphere.center, [0, 0, 0]);
  t.equals(sphere.radius, 0.0);

  t.end();
});

test('BoundingSphere#constructor sets expected values', t => {
  const expectedCenter = new Vector3(1.0, 2.0, 3.0);
  const expectedRadius = 1.0;
  const sphere = new BoundingSphere(expectedCenter, expectedRadius);
  t.deepEquals(sphere.center, expectedCenter);
  t.equals(sphere.radius, expectedRadius);

  t.end();
});

test('BoundingSphere#clone', t => {
  const sphere = new BoundingSphere(new Vector3(1.0, 2.0, 3.0), 4.0);
  const result = sphere.clone();
  t.notEqual(sphere, result);
  t.deepEquals(sphere, result);

  t.end();
});

test('BoundingSphere#equals', t => {
  const sphere = new BoundingSphere(new Vector3(1.0, 2.0, 3.0), 4.0);
  t.equals(sphere.equals(new BoundingSphere(new Vector3(1.0, 2.0, 3.0), 4.0)), true);
  t.equals(sphere.equals(new BoundingSphere(new Vector3(5.0, 2.0, 3.0), 4.0)), false);
  t.equals(sphere.equals(new BoundingSphere(new Vector3(1.0, 6.0, 3.0), 4.0)), false);
  t.equals(sphere.equals(new BoundingSphere(new Vector3(1.0, 2.0, 7.0), 4.0)), false);
  t.equals(sphere.equals(new BoundingSphere(new Vector3(1.0, 2.0, 3.0), 8.0)), false);
  t.equals(sphere.equals(undefined), false);

  t.end();
});

test('BoundingSphere#fromOrientedBoundingBox works with a result', t => {
  const box = OrientedBoundingBox.fromPoints(getPositions());
  const sphere = new BoundingSphere();
  BoundingSphere.fromOrientedBoundingBox(box, sphere);
  t.equals(sphere.center, positionsCenter);
  t.ok(sphere.radius > 1.5);
  t.ok(sphere.radius < 2.0);

  t.end();
});

test('BoundingSphere#fromOrientedBoundingBox works without a result parameter', t => {
  const box = OrientedBoundingBox.fromPoints(getPositions());
  const sphere = BoundingSphere.fromOrientedBoundingBox(box);
  t.equals(sphere.center, positionsCenter);
  expect(sphere.radius).toBeGreaterThan(1.5);
  expect(sphere.radius).toBeLessThan(2.0);

  t.end();
});

test('BoundingSphere#throws from fromOrientedBoundingBox with undefined orientedBoundingBox parameter', t => {
  t.throws(() => sphere.fromOrientedBoundingBox(undefined));

  t.end();
});

test('BoundingSphere#intersectPlane with sphere on the positive side of a plane', t => {
  const sphere = new BoundingSphere(Vector3.ZERO, 0.5);
  const normal = Vector3.negate(Vector3.UNIT_X, new Vector3());
  const position = Vector3.UNIT_X;
  const plane = new Plane(normal, -Vector3.dot(normal, position));
  t.equals(sphere.intersectPlane(plane), Intersect.INSIDE);

  t.end();
});

test('BoundingSphere#intersectPlane with sphere on the negative side of a plane', t => {
  const sphere = new BoundingSphere(Vector3.ZERO, 0.5);
  const normal = Vector3.UNIT_X;
  const position = Vector3.UNIT_X;
  const plane = new Plane(normal, -Vector3.dot(normal, position));
  t.equals(sphere.intersectPlane(plane), Intersect.OUTSIDE);

  t.end();
});

test('BoundingSphere#intersectPlane with sphere intersecting a plane', t => {
  const sphere = new BoundingSphere(Vector3.UNIT_X, 0.5);
  const normal = Vector3.UNIT_X;
  const position = Vector3.UNIT_X;
  const plane = new Plane(normal, -Vector3.dot(normal, position));
  t.equals(sphere.intersectPlane(plane), Intersect.INTERSECTING);

  t.end();
});

test('BoundingSphere#expands to contain another sphere', t => {
  const bs1 = new BoundingSphere(Vector3.negate(Vector3.UNIT_X, new Vector3()), 1.0);
  const bs2 = new BoundingSphere(Vector3.UNIT_X, 1.0);
  const expected = new BoundingSphere(Vector3.ZERO, 2.0);
  t.equals(BoundingSphere.union(bs1, bs2), expected);

  t.end();
});

test('BoundingSphere#union left sphere encloses right', t => {
  const bs1 = new BoundingSphere(Vector3.ZERO, 3.0);
  const bs2 = new BoundingSphere(Vector3.UNIT_X, 1.0);
  const union = BoundingSphere.union(bs1, bs2);
  t.equals(union, bs1);

  t.end();
});

test('BoundingSphere#union of co-located spheres, right sphere encloses left', t => {
  const bs1 = new BoundingSphere(Vector3.UNIT_X, 1.0);
  const bs2 = new BoundingSphere(Vector3.UNIT_X, 2.0);
  const union = BoundingSphere.union(bs1, bs2);
  t.equals(union, bs2);

  t.end();
});

test('BoundingSphere#union result parameter is a tight fit', t => {
  const bs1 = new BoundingSphere(
    Vector3.multiplyByScalar(Vector3.negate(Vector3.UNIT_X, new Vector3()), 3.0, new Vector3()),
    3.0
  );
  const bs2 = new BoundingSphere(Vector3.UNIT_X, 1.0);
  const expected = new BoundingSphere(
    Vector3.multiplyByScalar(Vector3.negate(Vector3.UNIT_X, new Vector3()), 2.0, new Vector3()),
    4.0
  );
  BoundingSphere.union(bs1, bs2, bs1);
  t.equals(bs1, expected);

  t.end();
});

test('BoundingSphere#expands to contain another point', t => {
  const bs = new BoundingSphere(Vector3.negate(Vector3.UNIT_X, new Vector3()), 1.0);
  const point = Vector3.UNIT_X;
  const expected = new BoundingSphere(Vector3.negate(Vector3.UNIT_X, new Vector3()), 2.0);
  t.equals(BoundingSphere.expand(bs, point), expected);

  t.end();
});

test('BoundingSphere#applies transform', t => {
  const bs = new BoundingSphere(Vector3.ZERO, 1.0);
  const transform = Matrix4.fromTranslation(new Vector3(1.0, 2.0, 3.0));
  const expected = new BoundingSphere(new Vector3(1.0, 2.0, 3.0), 1.0);
  t.equals(BoundingSphere.transform(bs, transform), expected);

  t.end();
});

test('BoundingSphere#applies scale transform', t => {
  const bs = new BoundingSphere(Vector3.ZERO, 1.0);
  const transform = Matrix4.fromScale(new Vector3(1.0, 2.0, 3.0));
  const expected = new BoundingSphere(Vector3.ZERO, 3.0);
  t.equals(BoundingSphere.transform(bs, transform), expected);

  t.end();
});

test('BoundingSphere#applies transform without scale', t => {
  const bs = new BoundingSphere(Vector3.ZERO, 1.0);
  const transform = Matrix4.fromTranslation(new Vector3(1.0, 2.0, 3.0));
  const expected = new BoundingSphere(new Vector3(1.0, 2.0, 3.0), 1.0);
  t.equals(BoundingSphere.transformWithoutScale(bs, transform), expected);

  t.end();
});

test('BoundingSphere#transformWithoutScale ignores scale', t => {
  const bs = new BoundingSphere(Vector3.ZERO, 1.0);
  const transform = Matrix4.fromScale(new Vector3(1.0, 2.0, 3.0));
  const expected = new BoundingSphere(Vector3.ZERO, 1.0);
  t.equals(BoundingSphere.transformWithoutScale(bs, transform), expected);

  t.end();
});

test('BoundingSphere#finds distances', t => {
  const bs = new BoundingSphere(Vector3.ZERO, 1.0);
  const position = new Vector3(-2.0, 1.0, 0.0);
  const direction = Vector3.UNIT_X;
  const expected = new Interval(1.0, 3.0);
  t.equals(BoundingSphere.computePlaneDistances(bs, position, direction), expected);

  t.end();
});

test('BoundingSphere#estimated distance squared to point', t => {
  const bs = new BoundingSphere(Vector3.ZERO, 1.0);
  const position = new Vector3(-2.0, 1.0, 0.0);
  const expected = Vector3.magnitudeSquared(position) - 1.0;
  t.equals(BoundingSphere.distanceSquaredTo(bs, position), expected);

  t.end();
});
test('BoundingSphere#fromCornerPoints', t => {
  const sphere = BoundingSphere.fromCornerPoints(
    new Vector3(-1.0, -0.0, 0.0),
    new Vector3(1.0, 0.0, 0.0)
  );
  t.equals(sphere, new BoundingSphere(Vector3.ZERO, 1.0));

  t.end();
});

test('BoundingSphere#fromCornerPoints throws without corner', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.fromCornerPoints());

  t.end();
});

test('BoundingSphere#fromCornerPoints throws without oppositeCorner', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.fromCornerPoints(Vector3.UNIT_X));

  t.end();
});

/*
test('BoundingSphere#fromEllipsoid', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const sphere = BoundingSphere.fromEllipsoid(ellipsoid);
  t.equals(sphere.center, Vector3.ZERO);
  t.equals(sphere.radius, ellipsoid.maximumRadius);

  t.end();
});

test('BoundingSphere#fromEllipsoid with a result parameter', t => {
  const ellipsoid = Ellipsoid.WGS84;
  const sphere = new BoundingSphere(new Vector3(1.0, 2.0, 3.0), 4.0);
  const result = BoundingSphere.fromEllipsoid(ellipsoid, sphere);
  expect(result).toBe(sphere);
  t.equals(result, new BoundingSphere(Vector3.ZERO, ellipsoid.maximumRadius));

  t.end();
});

test('BoundingSphere#fromEllipsoid throws without ellipsoid', t => {
  t.throws(() => sphere.fromEllipsoid());

  t.end();
});

test('BoundingSphere#fromBoundingSpheres with undefined returns an empty sphere', t => {
  const sphere = BoundingSphere.fromBoundingSpheres();
  t.equals(sphere.center, Vector3.ZERO);
  t.equals(sphere.radius, 0.0);

  t.end();
});

test('BoundingSphere#fromBoundingSpheres with empty array returns an empty sphere', t => {
  const sphere = BoundingSphere.fromBoundingSpheres([]);
  t.equals(sphere.center, Vector3.ZERO);
  t.equals(sphere.radius, 0.0);

  t.end();
});

test('BoundingSphere#fromBoundingSpheres works with 1 sphere', t => {
  const one = new BoundingSphere(new Vector3(1, 2, 3), 4);

  const sphere = BoundingSphere.fromBoundingSpheres([one]);
  t.equals(sphere, one);

  t.end();
});

test('BoundingSphere#fromBoundingSpheres works with 2 spheres', t => {
  const one = new BoundingSphere(new Vector3(1, 2, 3), 4);
  const two = new BoundingSphere(new Vector3(5, 6, 7), 8);

  const sphere = BoundingSphere.fromBoundingSpheres([one, two]);
  t.equals(sphere, BoundingSphere.union(one, two, new BoundingSphere()));

  t.end();
});

test('BoundingSphere#fromBoundingSpheres works with 3 spheres', t => {
  const one = new BoundingSphere(new Vector3(0, 0, 0), 1);
  const two = new BoundingSphere(new Vector3(0, 3, 0), 1);
  const three = new BoundingSphere(new Vector3(0, 0, 4), 1);

  const expected = new BoundingSphere(new Vector3(0.0, 1.5, 2.0), 3.5);
  const sphere = BoundingSphere.fromBoundingSpheres([one, two, three]);
  t.equals(sphere, expected);

  t.end();
});

test('BoundingSphere#projectTo2D', t => {
  const positions = getPositions();
  const projection = new GeographicProjection();

  const positions2D = [];
  for (let i = 0; i < positions.length; ++i) {
    const position = positions[i];
    const cartographic = projection.ellipsoid.cartesianToCartographic(position);
    positions2D.push(projection.project(cartographic));
  }

  const boundingSphere3D = BoundingSphere.fromPoints(positions);
  const boundingSphere2D = BoundingSphere.projectTo2D(boundingSphere3D, projection);
  const actualSphere = BoundingSphere.fromPoints(positions2D);
  actualSphere.center = new Vector3(actualSphere.center.z, actualSphere.center.x, actualSphere.center.y);

  expect(boundingSphere2D.center).toEqualEpsilon(actualSphere.center, CesiumMath.EPSILON6);
  expect(boundingSphere2D.radius).toBeGreaterThan(actualSphere.radius);

  t.end();
});

test('BoundingSphere#projectTo2D with result parameter', t => {
  const positions = getPositions();
  const projection = new GeographicProjection();
  const sphere = new BoundingSphere();

  const positions2D = [];
  for (let i = 0; i < positions.length; ++i) {
    const position = positions[i];
    const cartographic = projection.ellipsoid.cartesianToCartographic(position);
    positions2D.push(projection.project(cartographic));
  }

  const boundingSphere3D = BoundingSphere.fromPoints(positions);
  const boundingSphere2D = BoundingSphere.projectTo2D(boundingSphere3D, projection, sphere);
  const actualSphere = BoundingSphere.fromPoints(positions2D);
  actualSphere.center = new Vector3(actualSphere.center.z, actualSphere.center.x, actualSphere.center.y);

  expect(boundingSphere2D).toBe(sphere);
  expect(boundingSphere2D.center).toEqualEpsilon(actualSphere.center, CesiumMath.EPSILON6);
  expect(boundingSphere2D.radius).toBeGreaterThan(actualSphere.radius);

  t.end();
});

test('BoundingSphere#can pack and unpack', t => {
  const array = [];
  const boundingSphere = new BoundingSphere();
  boundingSphere.center = new Vector3(1, 2, 3);
  boundingSphere.radius = 4;
  BoundingSphere.pack(boundingSphere, array);
  t.equals(array.length, BoundingSphere.packedLength);
  t.equals(BoundingSphere.unpack(array), boundingSphere);

  t.end();
});

test('BoundingSphere#can pack and unpack with offset', t => {
  const packed = new Array(3);
  const offset = 3;
  const boundingSphere = new BoundingSphere();
  boundingSphere.center = new Vector3(1, 2, 3);
  boundingSphere.radius = 4;

  BoundingSphere.pack(boundingSphere, packed, offset);
  t.equals(packed.length, offset + BoundingSphere.packedLength);

  const result = new BoundingSphere();
  const returnedResult = BoundingSphere.unpack(packed, offset, result);
  expect(returnedResult).toBe(result);
  t.equals(result, boundingSphere);

  t.end();
});

test('BoundingSphere#pack throws with undefined boundingSphere', t => {
  const array = [];
  t.throws(() => sphere.pack(undefined, array));

  t.end();
});

test('BoundingSphere#pack throws with undefined array', t => {
  const boundingSphere = new BoundingSphere();
  t.throws(() => sphere.pack(boundingSphere, undefined));

  t.end();
});

test('BoundingSphere#unpack throws with undefined array', t => {
  t.throws(() => sphere.unpack(undefined));

  t.end();
});

test('BoundingSphere#static projectTo2D throws without sphere', t => {
  t.throws(() => sphere.projectTo2D());

  t.end();
});

test('BoundingSphere#clone returns undefined with no parameter', t => {
  expect(BoundingSphere.clone()).toBeUndefined();

  t.end();
});

test('BoundingSphere#union throws with no left parameter', t => {
  const right = new BoundingSphere();
  t.throws(() => sphere.union(undefined, right));

  t.end();
});

test('BoundingSphere#union throws with no right parameter', t => {
  const left = new BoundingSphere();
  t.throws(() => sphere.union(left, undefined));

  t.end();
});

test('BoundingSphere#expand throws without a sphere', t => {
  const sphere = new BoundingSphere();
  const plane = new Vector3();
  t.throws(() => sphere.expand(undefined, plane));

  t.end();
});

test('BoundingSphere#expand throws without a point', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.expand(sphere, undefined));

  t.end();
});

test('BoundingSphere#intersectPlane throws without a sphere', t => {
  const sphere = new BoundingSphere();
  const plane = new Plane(Vector3.UNIT_X, 0.0);
  t.throws(() => sphere.intersectPlane(undefined, plane));

  t.end();
});

test('BoundingSphere#intersectPlane throws without a plane', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.intersectPlane(sphere, undefined));

  t.end();
});

test('BoundingSphere#transform throws without a sphere', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.transform());

  t.end();
});

test('BoundingSphere#transform throws without a transform', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.transform(sphere));

  t.end();
});

test('BoundingSphere#distanceSquaredTo throws without a sphere', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.distanceSquaredTo());

  t.end();
});

test('BoundingSphere#distanceSquaredTo throws without a cartesian', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.distanceSquaredTo(new BoundingSphere()));

  t.end();
});

test('BoundingSphere#transformWithoutScale throws without a sphere', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.transformWithoutScale());

  t.end();
});

test('BoundingSphere#transformWithoutScale throws without a transform', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.transformWithoutScale(sphere));

  t.end();
});

test('BoundingSphere#computePlaneDistances throws without a sphere', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.computePlaneDistances());

  t.end();
});

test('BoundingSphere#computePlaneDistances throws without a position', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.computePlaneDistances(new BoundingSphere()));

  t.end();
});

test('BoundingSphere#computePlaneDistances throws without a direction', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.computePlaneDistances(new BoundingSphere(), new Vector3()));

  t.end();
});

test('BoundingSphere#isOccluded throws without a sphere', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.isOccluded());

  t.end();
});

test('BoundingSphere#isOccluded throws without an occluder', t => {
  const sphere = new BoundingSphere();
  t.throws(() => sphere.isOccluded(new BoundingSphere()));

  t.end();
});

/*
function expectBoundingSphereToContainPoint(boundingSphere, point, projection) {
  const pointInCartesian = projection.project(point);
  const distanceFromCenter = Vector3.magnitude(Vector3.subtract(pointInCartesian, boundingSphere.center, new Vector3()));

  // The distanceFromCenter for corner points at the height extreme should equal the
  // bounding sphere's radius.  But due to rounding errors it can end up being
  // very slightly greater.  Pull in the distanceFromCenter slightly to
  // account for this possibility.
  distanceFromCenter -= CesiumMath.EPSILON9;

  expect(distanceFromCenter).toBeLessThanOrEqualTo(boundingSphere.radius);
}

test('BoundingSphere#fromRectangleWithHeights2D includes specified min and max heights', t => {
  const rectangle = new Rectangle(0.1, 0.5, 0.2, 0.6);
  const projection = new GeographicProjection();
  const minHeight = -327.0;
  const maxHeight = 2456.0;
  const boundingSphere = BoundingSphere.fromRectangleWithHeights2D(rectangle, projection, minHeight, maxHeight);

  // Test that the corners are inside the bounding sphere.
  const point = Rectangle.southwest(rectangle).clone();
  point.height = minHeight;
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = Rectangle.southwest(rectangle).clone();
  point.height = maxHeight;
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = Rectangle.northeast(rectangle).clone();
  point.height = minHeight;
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = Rectangle.northeast(rectangle).clone();
  point.height = maxHeight;
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = Rectangle.southeast(rectangle).clone();
  point.height = minHeight;
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = Rectangle.southeast(rectangle).clone();
  point.height = maxHeight;
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = Rectangle.northwest(rectangle).clone();
  point.height = minHeight;
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = Rectangle.northwest(rectangle).clone();
  point.height = maxHeight;
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  // Test that the center is inside the bounding sphere
  point = Rectangle.center(rectangle).clone();
  point.height = minHeight;
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = Rectangle.center(rectangle).clone();
  point.height = maxHeight;
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  // Test that the edge midpoints are inside the bounding sphere.
  point = new Cartographic(Rectangle.center(rectangle).longitude, rectangle.south, minHeight);
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = new Cartographic(Rectangle.center(rectangle).longitude, rectangle.south, maxHeight);
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = new Cartographic(Rectangle.center(rectangle).longitude, rectangle.north, minHeight);
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = new Cartographic(Rectangle.center(rectangle).longitude, rectangle.north, maxHeight);
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = new Cartographic(rectangle.west, Rectangle.center(rectangle).latitude, minHeight);
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = new Cartographic(rectangle.west, Rectangle.center(rectangle).latitude, maxHeight);
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = new Cartographic(rectangle.east, Rectangle.center(rectangle).latitude, minHeight);
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  point = new Cartographic(rectangle.east, Rectangle.center(rectangle).latitude, maxHeight);
  expectBoundingSphereToContainPoint(boundingSphere, point, projection);

  t.end();
});

test('BoundingSphere#computes the volume of a BoundingSphere', t => {
  const sphere = new BoundingSphere(new Vector3(), 1.0);
  const computedVolume = sphere.volume();
  const expectedVolume = (4.0 / 3.0) * CesiumMath.PI;
  expect(computedVolume).toEqualEpsilon(expectedVolume, CesiumMath.EPSILON6);
});
*/
