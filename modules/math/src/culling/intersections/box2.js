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

// @author bhouston / http://clara.io

import Vector2 from '../vector2';

const v1 = new Vector2();

export default class Box2 {
  constructor(min, max) {
    this.min = min !== undefined ? min : new Vector2(Number.MAX_VALUE, Number.MAX_VALUE);
    this.max = max !== undefined ? max : new Vector2(Number.MIN_VALUE, Number.MIN_VALUE);
  }

  clone() {
    return new this.constructor().copy(this);
  }

  copy(box) {
    this.min.copy(box.min);
    this.max.copy(box.max);
    return this;
  }

  equals(box) {
    return box.min.equals(this.min) && box.max.equals(this.max);
  }

  set(min, max) {
    this.min.copy(min);
    this.max.copy(max);
    return this;
  }

  setFromPoints(points) {
    this.makeEmpty();
    for (let i = 0, il = points.length; i < il; i++) {
      this.expandByPoint(points[i]);
    }
    return this;
  }

  setFromCenterAndSize(center, size) {
    const halfSize = v1.copy(size).multiplyScalar(0.5);
    this.min.copy(center).sub(halfSize);
    this.max.copy(center).add(halfSize);
    return this;
  }

  makeEmpty() {
    this.min.x = this.min.y = Number.MAX_VALUE;
    this.max.x = this.max.y = Number.MIN_VALUE;
    return this;
  }

  intersect(box) {
    this.min.max(box.min);
    this.max.min(box.max);
    return this;
  }

  union(box) {
    this.min.min(box.min);
    this.max.max(box.max);
    return this;
  }

  expandByPoint(point) {
    this.min.min(point);
    this.max.max(point);
    return this;
  }

  expandByVector(vector) {
    this.min.sub(vector);
    this.max.add(vector);
    return this;
  }

  expandByScalar(scalar) {
    this.min.addScalar(-scalar);
    this.max.addScalar(scalar);
    return this;
  }

  translate(offset) {
    this.min.add(offset);
    this.max.add(offset);
    return this;
  }

  // ACCESSORS

  isEmpty() {
    // this is a more robust check for empty than (volume <= 0)
    // because volume can get positive with two negative axes
    return this.max.x < this.min.x || this.max.y < this.min.y;
  }

  getCenter(target) {
    target = target || new Vector2();
    return this.isEmpty()
      ? target.set(0, 0)
      : target.addVectors(this.min, this.max).multiplyScalar(0.5);
  }

  getSize(target) {
    target = target || new Vector2();
    return this.isEmpty() ? target.set(0, 0) : target.subVectors(this.max, this.min);
  }

  containsPoint(point) {
    return !(
      point.x < this.min.x ||
      point.x > this.max.x ||
      point.y < this.min.y ||
      point.y > this.max.y
    );
  }

  containsBox(box) {
    return (
      this.min.x <= box.min.x &&
      box.max.x <= this.max.x &&
      this.min.y <= box.min.y &&
      box.max.y <= this.max.y
    );
  }

  // This can potentially have a divide by zero if the box
  // has a size dimension of 0.
  getParameter(point, target = new Vector2()) {
    return target.set(
      (point.x - this.min.x) / (this.max.x - this.min.x),
      (point.y - this.min.y) / (this.max.y - this.min.y)
    );
  }

  intersectsBox(box) {
    // using 4 splitting planes to rule out intersections
    return !(
      box.max.x < this.min.x ||
      box.min.x > this.max.x ||
      box.max.y < this.min.y ||
      box.min.y > this.max.y
    );
  }

  clampPoint(point, target = new Vector2()) {
    return target.copy(point).clamp(this.min, this.max);
  }

  distanceToPoint(point) {
    const clampedPoint = v1.copy(point).clamp(this.min, this.max);
    return clampedPoint.sub(point).len();
  }
}
