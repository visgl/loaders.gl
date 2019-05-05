/* eslint-disable */
import test from 'tape-catch';

import {Vector3} from 'math.gl';
import {Plane} from '@loaders.gl/math'; // 'math.gl/culling';

test('constructs', () => {
  var normal = Vector3.UNIT_X;
  var distance = 1.0;
  var plane = new Plane(normal, distance);
  expect(plane.normal).toEqual(normal);
  expect(plane.distance).toEqual(distance);
});

test('constructor throws without a normal', () => {
  expect(function() {
    return new Plane(undefined, 0.0);
  }).toThrowDeveloperError();
});

test('constructor throws if normal is not normalized', () => {
  expect(function() {
    return new Plane(new Vector3(1.0, 2.0, 3.0), 0.0);
  }).toThrowDeveloperError();
});

test('constructor throws without a distance', () => {
  expect(function() {
    return new Plane(Vector3.UNIT_X, undefined);
  }).toThrowDeveloperError();
});

test('constructs from a point and a normal', () => {
  var normal = new Vector3(1.0, 2.0, 3.0);
  normal = Vector3.normalize(normal, normal);
  var point = new Vector3(4.0, 5.0, 6.0);
  var plane = Plane.fromPointNormal(point, normal);
  expect(plane.normal).toEqual(normal);
  expect(plane.distance).toEqual(-Vector3.dot(normal, point));
});

test('constructs from a point and a normal with result', () => {
  var normal = new Vector3(1.0, 2.0, 3.0);
  normal = Vector3.normalize(normal, normal);
  var point = new Vector3(4.0, 5.0, 6.0);

  var plane = new Plane(Vector3.UNIT_X, 0.0);
  Plane.fromPointNormal(point, normal, plane);

  expect(plane.normal).toEqual(normal);
  expect(plane.distance).toEqual(-Vector3.dot(normal, point));
});

test('constructs from a Cartesian4 without result', () => {
  var result = Plane.fromCartesian4(Cartesian4.UNIT_X);

  expect(result.normal).toEqual(Vector3.UNIT_X);
  expect(result.distance).toEqual(0.0);
});

test('constructs from a Cartesian4 with result', () => {
  var result = new Plane(Vector3.UNIT_X, 0.0);
  Plane.fromCartesian4(Cartesian4.UNIT_X, result);

  expect(result.normal).toEqual(Vector3.UNIT_X);
  expect(result.distance).toEqual(0.0);
});

test('fromPointNormal throws without a point', () => {
  expect(function() {
    return Plane.fromPointNormal(undefined, Vector3.UNIT_X);
  }).toThrowDeveloperError();
});

test('fromPointNormal throws without a normal', () => {
  expect(function() {
    return Plane.fromPointNormal(Vector3.UNIT_X, undefined);
  }).toThrowDeveloperError();
});

test('fromPointNormal throws if normal is not normalized', () => {
  expect(function() {
    return Plane.fromPointNormal(Vector3.ZERO, Vector3.ZERO);
  }).toThrowDeveloperError();
});

test('fromCartesian4 throws without coefficients', () => {
  expect(function() {
    return Plane.fromCartesian4(undefined);
  }).toThrowDeveloperError();
});

test('fromCartesian4 throws if normal is not normalized', () => {
  expect(function() {
    return Plane.fromCartesian4(new Cartesian4(1.0, 2.0, 3.0, 4.0));
  }).toThrowDeveloperError();
});

test('gets the distance to a point', () => {
  var normal = new Vector3(1.0, 2.0, 3.0);
  normal = Vector3.normalize(normal, normal);
  var plane = new Plane(normal, 12.34);
  var point = new Vector3(4.0, 5.0, 6.0);

  expect(Plane.getPointDistance(plane, point)).toEqual(
    Vector3.dot(plane.normal, point) + plane.distance
  );
});

test('getPointDistance throws without a plane', () => {
  var point = Vector3.ZERO;
  expect(function() {
    return Plane.getPointDistance(undefined, point);
  }).toThrowDeveloperError();
});

test('getPointDistance throws without a point', () => {
  var plane = new Plane(Vector3.UNIT_X, 0.0);
  expect(function() {
    return Plane.getPointDistance(plane, undefined);
  }).toThrowDeveloperError();
});

test('projects a point onto the plane', () => {
  var plane = new Plane(Vector3.UNIT_X, 0.0);
  var point = new Vector3(1.0, 1.0, 0.0);
  var result = Plane.projectPointOntoPlane(plane, point);
  expect(result).toEqual(new Vector3(0.0, 1.0, 0.0));

  plane = new Plane(Vector3.UNIT_Y, 0.0);
  result = Plane.projectPointOntoPlane(plane, point);
  expect(result).toEqual(new Vector3(1.0, 0.0, 0.0));
});

test('projectPointOntoPlane uses result parameter', () => {
  var plane = new Plane(Vector3.UNIT_X, 0.0);
  var point = new Vector3(1.0, 1.0, 0.0);
  var result = new Vector3();
  var returnedResult = Plane.projectPointOntoPlane(plane, point, result);
  expect(result).toBe(returnedResult);
  expect(result).toEqual(new Vector3(0.0, 1.0, 0.0));
});

test('projectPointOntoPlane requires the plane and point parameters', () => {
  expect(function() {
    return Plane.projectPointOntoPlane(new Plane(Vector3.UNIT_X, 0), undefined);
  }).toThrowDeveloperError();

  expect(function() {
    return Plane.projectPointOntoPlane(undefined, new Vector3());
  }).toThrowDeveloperError();
});

test('clone throws without a plane', () => {
  expect(function() {
    Plane.clone(undefined);
  }).toThrowDeveloperError();
});

test('clones a plane instance', () => {
  var normal = new Vector3(1.0, 2.0, 3.0);
  normal = Vector3.normalize(normal, normal);
  var distance = 4.0;
  var plane = new Plane(normal, distance);

  var result = Plane.clone(plane);
  expect(result.normal).toEqual(normal);
  expect(result.distance).toEqual(distance);
});

test('clones a plane instance into a result paramter', () => {
  var normal = new Vector3(1.0, 2.0, 3.0);
  normal = Vector3.normalize(normal, normal);
  var distance = 4.0;
  var plane = new Plane(normal, distance);

  var result = new Plane(Vector3.UNIT_X, 1.0);

  Plane.clone(plane, result);
  expect(result.normal).toEqual(normal);
  expect(result.distance).toEqual(distance);
});

test('equals returns true only if two planes are equal by normal and distance', () => {
  var left = new Plane(Vector3.UNIT_X, 0.0);
  var right = new Plane(Vector3.UNIT_Y, 1.0);

  expect(Plane.equals(left, right)).toBe(false);

  right.distance = 0.0;

  expect(Plane.equals(left, right)).toBe(false);

  right.normal = Vector3.UNIT_X;

  expect(Plane.equals(left, right)).toBe(true);

  right.distance = 1.0;

  expect(Plane.equals(left, right)).toBe(false);
});

test('equals throws developer error is left is undefined', () => {
  var plane = new Plane(Vector3.UNIT_X, 0.0);
  expect(function() {
    return Plane.equals(undefined, plane);
  }).toThrowDeveloperError();
});

test('equals throws developer error is right is undefined', () => {
  var plane = new Plane(Vector3.UNIT_X, 0.0);
  expect(function() {
    return Plane.equals(plane, undefined);
  }).toThrowDeveloperError();
});

test('transforms a plane according to a transform', () => {
  var normal = new Vector3(1.0, 2.0, 3.0);
  normal = Vector3.normalize(normal, normal);
  var plane = new Plane(normal, 12.34);

  var transform = Matrix4.fromUniformScale(2.0);
  transform = Matrix4.multiplyByMatrix3(transform, Matrix3.fromRotationY(Math.PI), transform);

  var transformedPlane = Plane.transform(plane, transform);
  expect(transformedPlane.distance).toEqual(plane.distance * 2.0);
  expect(transformedPlane.normal.x).toEqualEpsilon(-plane.normal.x, CesiumMath.EPSILON10);
  expect(transformedPlane.normal.y).toEqual(plane.normal.y);
  expect(transformedPlane.normal.z).toEqual(-plane.normal.z);
});

test('transform throws without a plane', () => {
  var transform = Matrix4.IDENTITY;
  expect(function() {
    return Plane.transform(undefined, transform);
  }).toThrowDeveloperError();
});

test('transform throws without a transform', () => {
  var plane = new Plane(Vector3.UNIT_X, 0.0);
  expect(function() {
    return Plane.transform(plane, undefined);
  }).toThrowDeveloperError();
});
