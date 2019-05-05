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

import Frustum from 'math.gl/geometry/frustum';
import Sphere from 'math.gl/geometry/sphere';
import Plane from 'math.gl/geometry/plane';
import Box3 from 'math.gl/geometry/box3';

import {zero3, one3, eps} from './Constants.tests';

// import Mesh from '../../../../src/objects/Mesh';
// import Sprite from '../../../../src/objects/Sprite';
// import BoxGeometry from '../../../../src/geometries/BoxGeometry';

const unit3 = new Vector3(1, 0, 0);

function planeEquals(a, b, tolerance) {
  tolerance = tolerance || 0.0001;

  if (a.normal.distanceTo(b.normal) > tolerance) return false;
  if (Math.abs(a.constant - b.constant) > tolerance) return false;

  return true;
}

QUnit.test('Frustum#Instancing', assert => {
  var a = new Frustum();

  assert.ok(a.planes !== undefined, 'Passed!');
  assert.ok(a.planes.length === 6, 'Passed!');

  var pDefault = new Plane();
  for (var i = 0; i < 6; i++) {
    assert.ok(a.planes[i].equals(pDefault), 'Passed!');
  }

  var p0 = new Plane(unit3, -1);
  var p1 = new Plane(unit3, 1);
  var p2 = new Plane(unit3, 2);
  var p3 = new Plane(unit3, 3);
  var p4 = new Plane(unit3, 4);
  var p5 = new Plane(unit3, 5);

  var a = new Frustum(p0, p1, p2, p3, p4, p5);
  assert.ok(a.planes[0].equals(p0), 'Passed!');
  assert.ok(a.planes[1].equals(p1), 'Passed!');
  assert.ok(a.planes[2].equals(p2), 'Passed!');
  assert.ok(a.planes[3].equals(p3), 'Passed!');
  assert.ok(a.planes[4].equals(p4), 'Passed!');
  assert.ok(a.planes[5].equals(p5), 'Passed!');
  assert.end();
});

// PUBLIC STUFF
QUnit.test('Frustum#set', assert => {
  var a = new Frustum();
  var p0 = new Plane(unit3, -1);
  var p1 = new Plane(unit3, 1);
  var p2 = new Plane(unit3, 2);
  var p3 = new Plane(unit3, 3);
  var p4 = new Plane(unit3, 4);
  var p5 = new Plane(unit3, 5);

  a.set(p0, p1, p2, p3, p4, p5);

  assert.ok(a.planes[0].equals(p0), 'Check plane #0');
  assert.ok(a.planes[1].equals(p1), 'Check plane #1');
  assert.ok(a.planes[2].equals(p2), 'Check plane #2');
  assert.ok(a.planes[3].equals(p3), 'Check plane #3');
  assert.ok(a.planes[4].equals(p4), 'Check plane #4');
  assert.ok(a.planes[5].equals(p5), 'Check plane #5');
  assert.end();
});

QUnit.test('Frustum#clone', assert => {
  var p0 = new Plane(unit3, -1);
  var p1 = new Plane(unit3, 1);
  var p2 = new Plane(unit3, 2);
  var p3 = new Plane(unit3, 3);
  var p4 = new Plane(unit3, 4);
  var p5 = new Plane(unit3, 5);

  var b = new Frustum(p0, p1, p2, p3, p4, p5);
  var a = b.clone();
  assert.ok(a.planes[0].equals(p0), 'Passed!');
  assert.ok(a.planes[1].equals(p1), 'Passed!');
  assert.ok(a.planes[2].equals(p2), 'Passed!');
  assert.ok(a.planes[3].equals(p3), 'Passed!');
  assert.ok(a.planes[4].equals(p4), 'Passed!');
  assert.ok(a.planes[5].equals(p5), 'Passed!');

  // ensure it is a true copy by modifying source
  a.planes[0].copy(p1);
  assert.ok(b.planes[0].equals(p0), 'Passed!');
  assert.end();
});

QUnit.test('Frustum#copy', assert => {
  var p0 = new Plane(unit3, -1);
  var p1 = new Plane(unit3, 1);
  var p2 = new Plane(unit3, 2);
  var p3 = new Plane(unit3, 3);
  var p4 = new Plane(unit3, 4);
  var p5 = new Plane(unit3, 5);

  var b = new Frustum(p0, p1, p2, p3, p4, p5);
  var a = new Frustum().copy(b);
  assert.ok(a.planes[0].equals(p0), 'Passed!');
  assert.ok(a.planes[1].equals(p1), 'Passed!');
  assert.ok(a.planes[2].equals(p2), 'Passed!');
  assert.ok(a.planes[3].equals(p3), 'Passed!');
  assert.ok(a.planes[4].equals(p4), 'Passed!');
  assert.ok(a.planes[5].equals(p5), 'Passed!');

  // ensure it is a true copy by modifying source
  b.planes[0] = p1;
  assert.ok(a.planes[0].equals(p0), 'Passed!');
  assert.end();
});

QUnit.test('Frustum#setFromMatrix/makeOrthographic/containsPoint', assert => {
  var m = new Matrix4().makeOrthographic(-1, 1, -1, 1, 1, 100);
  var a = new Frustum().setFromMatrix(m);

  assert.ok(!a.containsPoint(new Vector3(0, 0, 0)), 'Passed!');
  assert.ok(a.containsPoint(new Vector3(0, 0, -50)), 'Passed!');
  assert.ok(a.containsPoint(new Vector3(0, 0, -1.001)), 'Passed!');
  assert.ok(a.containsPoint(new Vector3(-1, -1, -1.001)), 'Passed!');
  assert.ok(!a.containsPoint(new Vector3(-1.1, -1.1, -1.001)), 'Passed!');
  assert.ok(a.containsPoint(new Vector3(1, 1, -1.001)), 'Passed!');
  assert.ok(!a.containsPoint(new Vector3(1.1, 1.1, -1.001)), 'Passed!');
  assert.ok(a.containsPoint(new Vector3(0, 0, -100)), 'Passed!');
  assert.ok(a.containsPoint(new Vector3(-1, -1, -100)), 'Passed!');
  assert.ok(!a.containsPoint(new Vector3(-1.1, -1.1, -100.1)), 'Passed!');
  assert.ok(a.containsPoint(new Vector3(1, 1, -100)), 'Passed!');
  assert.ok(!a.containsPoint(new Vector3(1.1, 1.1, -100.1)), 'Passed!');
  assert.ok(!a.containsPoint(new Vector3(0, 0, -101)), 'Passed!');
  assert.end();
});

QUnit.test('Frustum#setFromMatrix/makePerspective/containsPoint', assert => {
  var m = new Matrix4().makePerspective(-1, 1, 1, -1, 1, 100);
  var a = new Frustum().setFromMatrix(m);

  assert.ok(!a.containsPoint(new Vector3(0, 0, 0)), 'Passed!');
  assert.ok(a.containsPoint(new Vector3(0, 0, -50)), 'Passed!');
  assert.ok(a.containsPoint(new Vector3(0, 0, -1.001)), 'Passed!');
  assert.ok(a.containsPoint(new Vector3(-1, -1, -1.001)), 'Passed!');
  assert.ok(!a.containsPoint(new Vector3(-1.1, -1.1, -1.001)), 'Passed!');
  assert.ok(a.containsPoint(new Vector3(1, 1, -1.001)), 'Passed!');
  assert.ok(!a.containsPoint(new Vector3(1.1, 1.1, -1.001)), 'Passed!');
  assert.ok(a.containsPoint(new Vector3(0, 0, -99.999)), 'Passed!');
  assert.ok(a.containsPoint(new Vector3(-99.999, -99.999, -99.999)), 'Passed!');
  assert.ok(!a.containsPoint(new Vector3(-100.1, -100.1, -100.1)), 'Passed!');
  assert.ok(a.containsPoint(new Vector3(99.999, 99.999, -99.999)), 'Passed!');
  assert.ok(!a.containsPoint(new Vector3(100.1, 100.1, -100.1)), 'Passed!');
  assert.ok(!a.containsPoint(new Vector3(0, 0, -101)), 'Passed!');
  assert.end();
});

QUnit.test('Frustum#setFromMatrix/makePerspective/intersectsSphere', assert => {
  var m = new Matrix4().makePerspective(-1, 1, 1, -1, 1, 100);
  var a = new Frustum().setFromMatrix(m);

  assert.ok(!a.intersectsSphere(new Sphere(new Vector3(0, 0, 0), 0)), 'Passed!');
  assert.ok(!a.intersectsSphere(new Sphere(new Vector3(0, 0, 0), 0.9)), 'Passed!');
  assert.ok(a.intersectsSphere(new Sphere(new Vector3(0, 0, 0), 1.1)), 'Passed!');
  assert.ok(a.intersectsSphere(new Sphere(new Vector3(0, 0, -50), 0)), 'Passed!');
  assert.ok(a.intersectsSphere(new Sphere(new Vector3(0, 0, -1.001), 0)), 'Passed!');
  assert.ok(a.intersectsSphere(new Sphere(new Vector3(-1, -1, -1.001), 0)), 'Passed!');
  assert.ok(!a.intersectsSphere(new Sphere(new Vector3(-1.1, -1.1, -1.001), 0)), 'Passed!');
  assert.ok(a.intersectsSphere(new Sphere(new Vector3(-1.1, -1.1, -1.001), 0.5)), 'Passed!');
  assert.ok(a.intersectsSphere(new Sphere(new Vector3(1, 1, -1.001), 0)), 'Passed!');
  assert.ok(!a.intersectsSphere(new Sphere(new Vector3(1.1, 1.1, -1.001), 0)), 'Passed!');
  assert.ok(a.intersectsSphere(new Sphere(new Vector3(1.1, 1.1, -1.001), 0.5)), 'Passed!');
  assert.ok(a.intersectsSphere(new Sphere(new Vector3(0, 0, -99.999), 0)), 'Passed!');
  assert.ok(a.intersectsSphere(new Sphere(new Vector3(-99.999, -99.999, -99.999), 0)), 'Passed!');
  assert.ok(!a.intersectsSphere(new Sphere(new Vector3(-100.1, -100.1, -100.1), 0)), 'Passed!');
  assert.ok(a.intersectsSphere(new Sphere(new Vector3(-100.1, -100.1, -100.1), 0.5)), 'Passed!');
  assert.ok(a.intersectsSphere(new Sphere(new Vector3(99.999, 99.999, -99.999), 0)), 'Passed!');
  assert.ok(!a.intersectsSphere(new Sphere(new Vector3(100.1, 100.1, -100.1), 0)), 'Passed!');
  assert.ok(a.intersectsSphere(new Sphere(new Vector3(100.1, 100.1, -100.1), 0.2)), 'Passed!');
  assert.ok(!a.intersectsSphere(new Sphere(new Vector3(0, 0, -101), 0)), 'Passed!');
  assert.ok(a.intersectsSphere(new Sphere(new Vector3(0, 0, -101), 1.1)), 'Passed!');
  assert.end();
});

QUnit.test('Frustum#intersectsObject', assert => {
  var m = new Matrix4().makePerspective(-1, 1, 1, -1, 1, 100);
  var a = new Frustum().setFromMatrix(m);
  var object = new Mesh(new BoxGeometry(1, 1, 1));
  var intersects;

  intersects = a.intersectsObject(object);
  assert.notOk(intersects, 'No intersection');

  object.position.set(-1, -1, -1);
  object.updateMatrixWorld();

  intersects = a.intersectsObject(object);
  assert.ok(intersects, 'Successful intersection');

  object.position.set(1, 1, 1);
  object.updateMatrixWorld();

  intersects = a.intersectsObject(object);
  assert.notOk(intersects, 'No intersection');
  assert.end();
});

QUnit.test('Frustum#intersectsSprite', assert => {
  var m = new Matrix4().makePerspective(-1, 1, 1, -1, 1, 100);
  var a = new Frustum().setFromMatrix(m);
  var sprite = new Sprite();
  var intersects;

  intersects = a.intersectsSprite(sprite);
  assert.notOk(intersects, 'No intersection');

  sprite.position.set(-1, -1, -1);
  sprite.updateMatrixWorld();

  intersects = a.intersectsSprite(sprite);
  assert.ok(intersects, 'Successful intersection');
  assert.end();
});

QUnit.todo('Frustum#intersectsSphere', assert => {
  assert.ok(false, "everything's gonna be alright");
  assert.end();
});

QUnit.test('Frustum#intersectsBox', assert => {
  var m = new Matrix4().makePerspective(-1, 1, 1, -1, 1, 100);
  var a = new Frustum().setFromMatrix(m);
  var box = new Box3(zero3.clone(), one3.clone());
  var intersects;

  intersects = a.intersectsBox(box);
  assert.notOk(intersects, 'No intersection');

  // add eps so that we prevent box touching the frustum, which might intersect depending on floating point numerics
  box.translate(new Vector3(-1 - eps, -1 - eps, -1 - eps));

  intersects = a.intersectsBox(box);
  assert.ok(intersects, 'Successful intersection');
  assert.end();
});

QUnit.todo('Frustum#containsPoint', assert => {
  assert.ok(false, "everything's gonna be alright");
  assert.end();
});
