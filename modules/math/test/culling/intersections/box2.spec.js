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

import {Vector2} from 'math.gl';

import Box2 from 'math.gl/geometry/box2';

import {negInf2, posInf2, zero2, one2, two2} from './constants';

// INSTANCING
test('Box2#Instancing', assert => {
  let a = new Box2();
  assert.ok(a.min.equals(posInf2), 'Passed!');
  assert.ok(a.max.equals(negInf2), 'Passed!');

  a = new Box2(zero2.clone(), zero2.clone());
  assert.ok(a.min.equals(zero2), 'Passed!');
  assert.ok(a.max.equals(zero2), 'Passed!');

  a = new Box2(zero2.clone(), one2.clone());
  assert.ok(a.min.equals(zero2), 'Passed!');
  assert.ok(a.max.equals(one2), 'Passed!');
  assert.end();
});

// PUBLIC STUFF
test('Box2#set', assert => {
  const a = new Box2();

  a.set(zero2, one2);
  assert.ok(a.min.equals(zero2), 'Passed!');
  assert.ok(a.max.equals(one2), 'Passed!');
  assert.end();
});

test('Box2#setFromPoints', assert => {
  const a = new Box2();

  a.setFromPoints([zero2, one2, two2]);
  assert.ok(a.min.equals(zero2), 'Passed!');
  assert.ok(a.max.equals(two2), 'Passed!');

  a.setFromPoints([one2]);
  assert.ok(a.min.equals(one2), 'Passed!');
  assert.ok(a.max.equals(one2), 'Passed!');

  a.setFromPoints([]);
  assert.ok(a.isEmpty(), 'Passed!');
  assert.end();
});

test.skip('Box2#setFromCenterAndSize', assert => {
  assert.pass("everything's gonna be alright");
  assert.end();
});

test.skip('Box2#clone', assert => {
  assert.pass("everything's gonna be alright");
  assert.end();
});

test('Box2#copy', assert => {
  var a = new Box2(zero2.clone(), one2.clone());
  var b = new Box2().copy(a);
  assert.ok(b.min.equals(zero2), 'Passed!');
  assert.ok(b.max.equals(one2), 'Passed!');

  // ensure that it is a true copy
  a.min = zero2;
  a.max = one2;
  assert.ok(b.min.equals(zero2), 'Passed!');
  assert.ok(b.max.equals(one2), 'Passed!');
  assert.end();
});

test('Box2#empty/makeEmpty', assert => {
  var a = new Box2();

  assert.ok(a.isEmpty(), 'Passed!');

  var a = new Box2(zero2.clone(), one2.clone());
  assert.ok(!a.isEmpty(), 'Passed!');

  a.makeEmpty();
  assert.ok(a.isEmpty(), 'Passed!');
  assert.end();
});

test.skip('Box2#isEmpty', assert => {
  assert.pass("everything's gonna be alright");
  assert.end();
});

test('Box2#getCenter', assert => {
  var a = new Box2(zero2.clone(), zero2.clone());
  var center = new Vector2();
  assert.ok(a.getCenter(center).equals(zero2), 'Passed!');

  var a = new Box2(zero2, one2);
  var midpoint = one2.clone().multiplyScalar(0.5);
  assert.ok(a.getCenter(center).equals(midpoint), 'Passed!');
  assert.end();
});

test('Box2#getSize', assert => {
  var a = new Box2(zero2.clone(), zero2.clone());
  var size = new Vector2();

  assert.ok(a.getSize(size).equals(zero2), 'Passed!');

  var a = new Box2(zero2.clone(), one2.clone());
  assert.ok(a.getSize(size).equals(one2), 'Passed!');
  assert.end();
});

test('Box2#expandByPoint', assert => {
  var a = new Box2(zero2.clone(), zero2.clone());
  var size = new Vector2();
  var center = new Vector2();

  a.expandByPoint(zero2);
  assert.ok(a.getSize(size).equals(zero2), 'Passed!');

  a.expandByPoint(one2);
  assert.ok(a.getSize(size).equals(one2), 'Passed!');

  a.expandByPoint(one2.clone().negate());
  assert.ok(a.getSize(size).equals(one2.clone().multiplyScalar(2)), 'Passed!');
  assert.ok(a.getCenter(center).equals(zero2), 'Passed!');
  assert.end();
});

test('Box2#expandByVector', assert => {
  var a = new Box2(zero2.clone(), zero2.clone());
  var size = new Vector2();
  var center = new Vector2();

  a.expandByVector(zero2);
  assert.ok(a.getSize(size).equals(zero2), 'Passed!');

  a.expandByVector(one2);
  assert.ok(a.getSize(size).equals(one2.clone().multiplyScalar(2)), 'Passed!');
  assert.ok(a.getCenter(center).equals(zero2), 'Passed!');
  assert.end();
});

test('Box2#expandByScalar', assert => {
  const a = new Box2(zero2.clone(), zero2.clone());
  const size = new Vector2();
  const center = new Vector2();

  a.expandByScalar(0);
  assert.ok(a.getSize(size).equals(zero2), 'Passed!');

  a.expandByScalar(1);
  assert.ok(a.getSize(size).equals(one2.clone().multiplyScalar(2)), 'Passed!');
  assert.ok(a.getCenter(center).equals(zero2), 'Passed!');
  assert.end();
});

test('Box2#containsPoint', assert => {
  const a = new Box2(zero2.clone(), zero2.clone());

  assert.ok(a.containsPoint(zero2), 'Passed!');
  assert.ok(!a.containsPoint(one2), 'Passed!');

  a.expandByScalar(1);
  assert.ok(a.containsPoint(zero2), 'Passed!');
  assert.ok(a.containsPoint(one2), 'Passed!');
  assert.ok(a.containsPoint(one2.clone().negate()), 'Passed!');
  assert.end();
});

test('Box2#containsBox', assert => {
  const a = new Box2(zero2.clone(), zero2.clone());
  const b = new Box2(zero2.clone(), one2.clone());
  const c = new Box2(one2.clone().negate(), one2.clone());

  assert.ok(a.containsBox(a), 'Passed!');
  assert.ok(!a.containsBox(b), 'Passed!');
  assert.ok(!a.containsBox(c), 'Passed!');

  assert.ok(b.containsBox(a), 'Passed!');
  assert.ok(c.containsBox(a), 'Passed!');
  assert.ok(!b.containsBox(c), 'Passed!');
  assert.end();
});

test('Box2#getParameter', assert => {
  const a = new Box2(zero2.clone(), one2.clone());
  const b = new Box2(one2.clone().negate(), one2.clone());

  const parameter = new Vector2();

  a.getParameter(zero2, parameter);
  assert.ok(parameter.equals(zero2), 'Passed!');
  a.getParameter(one2, parameter);
  assert.ok(parameter.equals(one2), 'Passed!');

  b.getParameter(one2.clone().negate(), parameter);
  assert.ok(parameter.equals(zero2), 'Passed!');
  b.getParameter(zero2, parameter);
  assert.ok(parameter.equals(new Vector2(0.5, 0.5)), 'Passed!');
  b.getParameter(one2, parameter);
  assert.ok(parameter.equals(one2), 'Passed!');
  assert.end();
});

test('Box2#intersectsBox', assert => {
  const a = new Box2(zero2.clone(), zero2.clone());
  const b = new Box2(zero2.clone(), one2.clone());
  const c = new Box2(one2.clone().negate(), one2.clone());

  assert.ok(a.intersectsBox(a), 'Passed!');
  assert.ok(a.intersectsBox(b), 'Passed!');
  assert.ok(a.intersectsBox(c), 'Passed!');

  assert.ok(b.intersectsBox(a), 'Passed!');
  assert.ok(c.intersectsBox(a), 'Passed!');
  assert.ok(b.intersectsBox(c), 'Passed!');

  b.translate(two2);
  assert.ok(!a.intersectsBox(b), 'Passed!');
  assert.ok(!b.intersectsBox(a), 'Passed!');
  assert.ok(!b.intersectsBox(c), 'Passed!');
  assert.end();
});

test('Box2#clampPoint', assert => {
  const a = new Box2(zero2.clone(), zero2.clone());
  const b = new Box2(one2.clone().negate(), one2.clone());

  const point = new Vector2();

  a.clampPoint(zero2, point);
  assert.ok(point.equals(new Vector2(0, 0)), 'Passed!');
  a.clampPoint(one2, point);
  assert.ok(point.equals(new Vector2(0, 0)), 'Passed!');
  a.clampPoint(one2.clone().negate(), point);
  assert.ok(point.equals(new Vector2(0, 0)), 'Passed!');

  b.clampPoint(two2, point);
  assert.ok(point.equals(new Vector2(1, 1)), 'Passed!');
  b.clampPoint(one2, point);
  assert.ok(point.equals(new Vector2(1, 1)), 'Passed!');
  b.clampPoint(zero2, point);
  assert.ok(point.equals(new Vector2(0, 0)), 'Passed!');
  b.clampPoint(one2.clone().negate(), point);
  assert.ok(point.equals(new Vector2(-1, -1)), 'Passed!');
  b.clampPoint(two2.clone().negate(), point);
  assert.ok(point.equals(new Vector2(-1, -1)), 'Passed!');
  assert.end();
});

test('Box2#distanceToPoint', assert => {
  var a = new Box2(zero2.clone(), zero2.clone());
  var b = new Box2(one2.clone().negate(), one2.clone());

  assert.ok(a.distanceToPoint(new Vector2(0, 0)) == 0, 'Passed!');
  assert.ok(a.distanceToPoint(new Vector2(1, 1)) == Math.sqrt(2), 'Passed!');
  assert.ok(a.distanceToPoint(new Vector2(-1, -1)) == Math.sqrt(2), 'Passed!');

  assert.ok(b.distanceToPoint(new Vector2(2, 2)) == Math.sqrt(2), 'Passed!');
  assert.ok(b.distanceToPoint(new Vector2(1, 1)) == 0, 'Passed!');
  assert.ok(b.distanceToPoint(new Vector2(0, 0)) == 0, 'Passed!');
  assert.ok(b.distanceToPoint(new Vector2(-1, -1)) == 0, 'Passed!');
  assert.ok(b.distanceToPoint(new Vector2(-2, -2)) == Math.sqrt(2), 'Passed!');
  assert.end();
});

test('Box2#intersect', assert => {
  var a = new Box2(zero2.clone(), zero2.clone());
  var b = new Box2(zero2.clone(), one2.clone());
  var c = new Box2(one2.clone().negate(), one2.clone());

  assert.ok(
    a
      .clone()
      .intersect(a)
      .equals(a),
    'Passed!'
  );
  assert.ok(
    a
      .clone()
      .intersect(b)
      .equals(a),
    'Passed!'
  );
  assert.ok(
    b
      .clone()
      .intersect(b)
      .equals(b),
    'Passed!'
  );
  assert.ok(
    a
      .clone()
      .intersect(c)
      .equals(a),
    'Passed!'
  );
  assert.ok(
    b
      .clone()
      .intersect(c)
      .equals(b),
    'Passed!'
  );
  assert.ok(
    c
      .clone()
      .intersect(c)
      .equals(c),
    'Passed!'
  );
  assert.end();
});

test('Box2#union', assert => {
  var a = new Box2(zero2.clone(), zero2.clone());
  var b = new Box2(zero2.clone(), one2.clone());
  var c = new Box2(one2.clone().negate(), one2.clone());

  assert.ok(
    a
      .clone()
      .union(a)
      .equals(a),
    'Passed!'
  );
  assert.ok(
    a
      .clone()
      .union(b)
      .equals(b),
    'Passed!'
  );
  assert.ok(
    a
      .clone()
      .union(c)
      .equals(c),
    'Passed!'
  );
  assert.ok(
    b
      .clone()
      .union(c)
      .equals(c),
    'Passed!'
  );
  assert.end();
});

test('Box2#translate', assert => {
  var a = new Box2(zero2.clone(), zero2.clone());
  var b = new Box2(zero2.clone(), one2.clone());
  var c = new Box2(one2.clone().negate(), one2.clone());
  var d = new Box2(one2.clone().negate(), zero2.clone());

  assert.ok(
    a
      .clone()
      .translate(one2)
      .equals(new Box2(one2, one2)),
    'Passed!'
  );
  assert.ok(
    a
      .clone()
      .translate(one2)
      .translate(one2.clone().negate())
      .equals(a),
    'Passed!'
  );
  assert.ok(
    d
      .clone()
      .translate(one2)
      .equals(b),
    'Passed!'
  );
  assert.ok(
    b
      .clone()
      .translate(one2.clone().negate())
      .equals(d),
    'Passed!'
  );
  assert.end();
});

test.skip('Box2#equals', assert => {
  assert.pass("everything's gonna be alright");
  assert.end();
});
