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

// Original author comments from THREE.js code
// @author bhouston / http://clara.io
// @author mrdoob / http://mrdoob.com/

import Box3 from './box3';
import Vector3 from '../vector3';

const box1 = new Box3();
const v1 = new Vector3();

export default class Sphere {
  constructor(center, radius) {
    this.center = center !== undefined ? center : new Vector3();
    this.radius = radius !== undefined ? radius : 0;
  }

  set(center, radius) {
    this.center.copy(center);
    this.radius = radius;
    return this;
  }

  // Box3.getBoundingSphere(target) => Sphere.setFromBox3
  setFromBox3(box) {
    box.getCenter(this.center);
    this.radius = box.getSize(v1).length() * 0.5;
    return this;
  }

  setFromPoints(points, optionalCenter) {
    const center = this.center;

    if (optionalCenter !== undefined) {
      center.copy(optionalCenter);
    } else {
      box1.setFromPoints(points).getCenter(center);
    }

    let maxRadiusSq = 0;
    for (let i = 0, il = points.length; i < il; i++) {
      maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(points[i]));
    }
    this.radius = Math.sqrt(maxRadiusSq);
    return this;
  }

  clone() {
    return new this.constructor().copy(this);
  }

  copy(sphere) {
    this.center.copy(sphere.center);
    this.radius = sphere.radius;
    return this;
  }

  equals(sphere) {
    return sphere.center.equals(this.center) && sphere.radius === this.radius;
  }

  empty() {
    return this.radius <= 0;
  }

  containsPoint(point) {
    return point.distanceToSquared(this.center) <= this.radius * this.radius;
  }

  distanceToPoint(point) {
    return point.distanceTo(this.center) - this.radius;
  }

  clampPoint(point, target = new Vector3()) {
    const deltaLengthSq = this.center.distanceToSquared(point);
    target.copy(point);
    if (deltaLengthSq > this.radius * this.radius) {
      target.sub(this.center).normalize();
      target.multiplyScalar(this.radius).add(this.center);
    }
    return target;
  }

  getBoundingBox(target = new Box3()) {
    target.set(this.center, this.center);
    target.expandByScalar(this.radius);
    return target;
  }

  applyMatrix4(matrix) {
    this.center.applyMatrix4(matrix);
    this.radius = this.radius * matrix.getMaxScaleOnAxis();
    return this;
  }

  translate(offset) {
    this.center.add(offset);
    return this;
  }

  intersectsSphere(sphere) {
    const radiusSum = this.radius + sphere.radius;
    return sphere.center.distanceToSquared(this.center) <= radiusSum * radiusSum;
  }

  // box3.intersectsSphere() => sphere.intersectsBox()
  intersectsBox(box) {
    const closestPoint = v1;
    // Find the point on the AABB closest to the sphere center.
    box.clampPoint(this.center, closestPoint);
    // If that point is inside the sphere, the AABB and sphere intersect.
    return closestPoint.distanceToSquared(this.center) <= this.radius * this.radius;
  }

  intersectsPlane(plane) {
    return Math.abs(plane.distanceToPoint(this.center)) <= this.radius;
  }
}
