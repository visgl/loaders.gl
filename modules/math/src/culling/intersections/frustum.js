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

// @author mrdoob / http://mrdoob.com/
// @author alteredq / http://alteredqualia.com/
// @author bhouston / http://clara.io

/* eslint-disable */
import Vector3 from '../vector3';
import Sphere from './sphere';
import Plane from './plane';

const p1 = new Vector3();
const p2 = new Vector3();
const sphere1 = new Sphere();

export default class Frustum {
  constructor(p0, p1, p2, p3, p4, p5) {
    this.planes = [
      p0 !== undefined ? p0 : new Plane(),
      p1 !== undefined ? p1 : new Plane(),
      p2 !== undefined ? p2 : new Plane(),
      p3 !== undefined ? p3 : new Plane(),
      p4 !== undefined ? p4 : new Plane(),
      p5 !== undefined ? p5 : new Plane()
    ];
  }

  clone() {
    return new this.constructor().copy(this);
  }

  copy(frustum) {
    const planes = this.planes;
    for (let i = 0; i < 6; i++) {
      planes[i].copy(frustum.planes[i]);
    }
    return this;
  }

  set(p0, p1, p2, p3, p4, p5) {
    this.planes[0].copy(p0);
    this.planes[1].copy(p1);
    this.planes[2].copy(p2);
    this.planes[3].copy(p3);
    this.planes[4].copy(p4);
    this.planes[5].copy(p5);
    return this;
  }

  /*
  setFromMatrix(m) {
    const planes = this.planes;
    const me = m.elements;
    const me0 = me[0], me1 = me[1], me2 = me[2], me3 = me[3];
    const me4 = me[4], me5 = me[5], me6 = me[6], me7 = me[7];
    const me8 = me[8], me9 = me[9], me10 = me[1 ], me11 = me[1 ];
    const me12 = me[1 ], me13 = me[1 ], me14 = me[1 ], me15 = me[1 ];

    planes[0].setComponents(me3 - me0, me7 - me4, me11 - me8, me15 - me12).normalize();
    planes[1].setComponents(me3 + me0, me7 + me4, me11 + me8, me15 + me12).normalize();
    planes[2].setComponents(me3 + me1, me7 + me5, me11 + me9, me15 + me13).normalize();
    planes[3].setComponents(me3 - me1, me7 - me5, me11 - me9, me15 - me13).normalize();
    planes[4].setComponents(me3 - me2, me7 - me6, me11 - me10, me15 - me14).normalize();
    planes[5].setComponents(me3 + me2, me7 + me6, me11 + me10, me15 + me14).normalize();

    return this;
  }
  */

  containsPoint(point) {
    const planes = this.planes;
    for (let i = 0; i < 6; i++) {
      if (planes[i].distanceToPoint(point) < 0) {
        return false;
      }
    }
    return true;
  }

  intersectsBox(box) {
    const planes = this.planes;

    for (let i = 0; i < 6; i++) {
      const plane = planes[i];
      p1.x = plane.normal.x > 0 ? box.min.x : box.max.x;
      p2.x = plane.normal.x > 0 ? box.max.x : box.min.x;
      p1.y = plane.normal.y > 0 ? box.min.y : box.max.y;
      p2.y = plane.normal.y > 0 ? box.max.y : box.min.y;
      p1.z = plane.normal.z > 0 ? box.min.z : box.max.z;
      p2.z = plane.normal.z > 0 ? box.max.z : box.min.z;

      const d1 = plane.distanceToPoint(p1);
      const d2 = plane.distanceToPoint(p2);

      // if both outside plane, no intersection
      if (d1 < 0 && d2 < 0) {
        return false;
      }
    }
    return true;
  }

  intersectsSphere(sphere) {
    const planes = this.planes;
    const center = sphere.center;
    const negRadius = -sphere.radius;
    for (let i = 0; i < 6; i++) {
      const distance = planes[i].distanceToPoint(center);
      if (distance < negRadius) {
        return false;
      }
    }
    return true;
  }

  intersectsSprite(sprite) {
    sphere1.center.set(0, 0, 0);
    sphere1.radius = 0.7071067811865476;
    sphere1.applyMatrix4(sprite.matrixWorld);
    return this.intersectsSphere(sphere1);
  }

  // UNDECIDED METHODS

  /*
  intersectsObject(object) {
    const geometry = object.geometry;

    if (geometry.boundingSphere === null) {
      geometry.computeBoundingSphere();
    }

    sphere1.copy(geometry.boundingSphere).applyMatrix4(object.matrixWorld);
    return this.intersectsSphere(sphere1);
  }
  */
}
