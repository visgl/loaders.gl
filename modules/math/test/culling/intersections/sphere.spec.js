// The MIT License
//
// Copyright © 2010-2018 three.js authors
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// This file was copied from THREE.js math test suite (MIT licensed)
// Original authors:
// @author bhouston / http://exocortex.com
// @author TristanVALCKE / https://github.com/Itee

/* eslint-disable */
import test from 'tape-catch';

import Vector3 from 'math.gl/vector3';
import Matrix4 from 'math.gl/matrix4';

import Box3 from 'math.gl/geometry/box3';
import Sphere from 'math.gl/geometry/sphere';
import Plane from 'math.gl/geometry/plane';

import {zero3, one3, two3, eps} from './constants';

// INSTANCING
test('Sphere#Instancing', assert => {
  var a = new Sphere();
  assert.ok(a.center.equals(zero3), 'Passed!');
  assert.ok(a.radius == 0, 'Passed!');

  var a = new Sphere(one3.clone(), 1);
  assert.ok(a.center.equals(one3), 'Passed!');
  assert.ok(a.radius == 1, 'Passed!');
  assert.end();
});

// PUBLIC STUFF
test.skip('Sphere#isSphere', assert => {
  assert.ok(false, "everything's gonna be alright");
  assert.end();
});

test('Sphere#set', assert => {
  var a = new Sphere();
  assert.ok(a.center.equals(zero3), 'Passed!');
  assert.ok(a.radius == 0, 'Passed!');

  a.set(one3, 1);
  assert.ok(a.center.equals(one3), 'Passed!');
  assert.ok(a.radius == 1, 'Passed!');
  assert.end();
});

test('Sphere#setFromPoints', assert => {
  var a = new Sphere();
  var expectedCenter = new Vector3(0.9330126941204071, 0, 0);
  var expectedRadius = 1.3676668773461689;
  var optionalCenter = new Vector3(1, 1, 1);
  var points = [
    new Vector3(1, 1, 0),
    new Vector3(1, 1, 0),
    new Vector3(1, 1, 0),
    new Vector3(1, 1, 0),
    new Vector3(1, 1, 0),
    new Vector3(0.8660253882408142, 0.5, 0),
    new Vector3(-0, 0.5, 0.8660253882408142),
    new Vector3(1.8660253882408142, 0.5, 0),
    new Vector3(0, 0.5, -0.8660253882408142),
    new Vector3(0.8660253882408142, 0.5, -0),
    new Vector3(0.8660253882408142, -0.5, 0),
    new Vector3(-0, -0.5, 0.8660253882408142),
    new Vector3(1.8660253882408142, -0.5, 0),
    new Vector3(0, -0.5, -0.8660253882408142),
    new Vector3(0.8660253882408142, -0.5, -0),
    new Vector3(-0, -1, 0),
    new Vector3(-0, -1, 0),
    new Vector3(0, -1, 0),
    new Vector3(0, -1, -0),
    new Vector3(-0, -1, -0)
  ];

  a.setFromPoints(points);
  assert.ok(Math.abs(a.center.x - expectedCenter.x) <= eps, 'Default center: check center.x');
  assert.ok(Math.abs(a.center.y - expectedCenter.y) <= eps, 'Default center: check center.y');
  assert.ok(Math.abs(a.center.z - expectedCenter.z) <= eps, 'Default center: check center.z');
  assert.ok(Math.abs(a.radius - expectedRadius) <= eps, 'Default center: check radius');

  var expectedRadius = 2.5946195770400102;
  a.setFromPoints(points, optionalCenter);
  assert.ok(Math.abs(a.center.x - optionalCenter.x) <= eps, 'Optional center: check center.x');
  assert.ok(Math.abs(a.center.y - optionalCenter.y) <= eps, 'Optional center: check center.y');
  assert.ok(Math.abs(a.center.z - optionalCenter.z) <= eps, 'Optional center: check center.z');
  assert.ok(Math.abs(a.radius - expectedRadius) <= eps, 'Optional center: check radius');
  assert.end();
});

test.skip('Sphere#clone', assert => {
  assert.ok(false, "everything's gonna be alright");
  assert.end();
});

test('Sphere#copy', assert => {
  var a = new Sphere(one3.clone(), 1);
  var b = new Sphere().copy(a);

  assert.ok(b.center.equals(one3), 'Passed!');
  assert.ok(b.radius == 1, 'Passed!');

  // ensure that it is a true copy
  a.center = zero3;
  a.radius = 0;
  assert.ok(b.center.equals(one3), 'Passed!');
  assert.ok(b.radius == 1, 'Passed!');
  assert.end();
});

test('Sphere#empty', assert => {
  var a = new Sphere();
  assert.ok(a.empty(), 'Passed!');

  a.set(one3, 1);
  assert.ok(!a.empty(), 'Passed!');
  assert.end();
});

test('Sphere#containsPoint', assert => {
  var a = new Sphere(one3.clone(), 1);

  assert.ok(!a.containsPoint(zero3), 'Passed!');
  assert.ok(a.containsPoint(one3), 'Passed!');
  assert.end();
});

test('Sphere#distanceToPoint', assert => {
  var a = new Sphere(one3.clone(), 1);

  assert.ok(a.distanceToPoint(zero3) - 0.732 < 0.001, 'Passed!');
  assert.ok(a.distanceToPoint(one3) === -1, 'Passed!');
  assert.end();
});

test('Sphere#intersectsSphere', assert => {
  var a = new Sphere(one3.clone(), 1);
  var b = new Sphere(zero3.clone(), 1);
  var c = new Sphere(zero3.clone(), 0.25);

  assert.ok(a.intersectsSphere(b), 'Passed!');
  assert.ok(!a.intersectsSphere(c), 'Passed!');
  assert.end();
});

test('Sphere#intersectsBox', assert => {
  var a = new Sphere();
  var b = new Sphere(new Vector3(-5, -5, -5));
  var box = new Box3(zero3, one3);

  assert.strictEqual(a.intersectsBox(box), true, 'Check default sphere');
  assert.strictEqual(b.intersectsBox(box), false, 'Check shifted sphere');
  assert.end();
});

test('Sphere#intersectsPlane', assert => {
  var a = new Sphere(zero3.clone(), 1);
  var b = new Plane(new Vector3(0, 1, 0), 1);
  var c = new Plane(new Vector3(0, 1, 0), 1.25);
  var d = new Plane(new Vector3(0, -1, 0), 1.25);

  assert.ok(a.intersectsPlane(b), 'Passed!');
  assert.ok(!a.intersectsPlane(c), 'Passed!');
  assert.ok(!a.intersectsPlane(d), 'Passed!');
  assert.end();
});

test('Sphere#clampPoint', assert => {
  var a = new Sphere(one3.clone(), 1);
  var point = new Vector3();

  a.clampPoint(new Vector3(1, 1, 3), point);
  assert.ok(point.equals(new Vector3(1, 1, 2)), 'Passed!');
  a.clampPoint(new Vector3(1, 1, -3), point);
  assert.ok(point.equals(new Vector3(1, 1, 0)), 'Passed!');
  assert.end();
});

test('Sphere#getBoundingBox', assert => {
  var a = new Sphere(one3.clone(), 1);
  var aabb = new Box3();

  a.getBoundingBox(aabb);
  assert.ok(aabb.equals(new Box3(zero3, two3)), 'Passed!');

  a.set(zero3, 0);
  a.getBoundingBox(aabb);
  assert.ok(aabb.equals(new Box3(zero3, zero3)), 'Passed!');
  assert.end();
});

test('Sphere#applyMatrix4', assert => {
  var a = new Sphere(one3.clone(), 1);
  var m = new Matrix4().makeTranslation(1, -2, 1);
  var aabb1 = new Box3();
  var aabb2 = new Box3();

  a.clone()
    .applyMatrix4(m)
    .getBoundingBox(aabb1);
  a.getBoundingBox(aabb2);

  assert.ok(aabb1.equals(aabb2.applyMatrix4(m)), 'Passed!');
  assert.end();
});

test('Sphere#translate', assert => {
  var a = new Sphere(one3.clone(), 1);

  a.translate(one3.clone().negate());
  assert.ok(a.center.equals(zero3), 'Passed!');
  assert.end();
});

test('Sphere#equals', assert => {
  var a = new Sphere();
  var b = new Sphere(new Vector3(1, 0, 0));
  var c = new Sphere(new Vector3(1, 0, 0), 1.0);

  assert.strictEqual(a.equals(b), false, 'a does not equal b');
  assert.strictEqual(a.equals(c), false, 'a does not equal c');
  assert.strictEqual(b.equals(c), false, 'b does not equal c');

  a.copy(b);
  assert.strictEqual(a.equals(b), true, 'a equals b after copy()');
  assert.end();
});
